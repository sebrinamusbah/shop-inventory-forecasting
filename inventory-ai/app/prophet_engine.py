import logging
import pandas as pd
from prophet import Prophet
from typing import Dict, Any
import numpy as np

logger = logging.getLogger(__name__)


class ProphetEngine:

    def __init__(self):
        self.models = {}

    def predict(
        self,
        product: Dict[str, Any],
        sales_data: pd.DataFrame,
        periods: int = 30
    ) -> Dict[str, Any]:

        if sales_data is None or sales_data.empty:
            return self._empty_response(product)

        if len(sales_data) < 7:
            return self._empty_response(product)

        df = sales_data.copy()

        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)
        df["y"] = df["y"].clip(lower=0)

        df = df.dropna(subset=["ds"])
        df = df.groupby("ds", as_index=False)["y"].sum()

        df = self._fill_missing_days(df)

        try:
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05
            )
            model.fit(df)

        except Exception as e:
            logger.exception("Prophet training failed")
            return self._empty_response(product)

        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)
        result = result.dropna()

        result["yhat"] = result["yhat"].fillna(0).clip(lower=0)

        predicted_demand = float(result["yhat"].sum())
        avg_daily = predicted_demand / max(periods, 1)

        interval_width = (result["yhat_upper"] - result["yhat_lower"]).mean()
        mean_forecast = result["yhat"].mean()
        historical_std = max(df["y"].std(), 1.0)

        uncertainty_ratio = interval_width / (abs(mean_forecast) + historical_std)

        confidence = float(np.clip(1 / (1 + uncertainty_ratio), 0.05, 1.0))

        historical_avg = df["y"].mean()
        future_avg = result["yhat"].mean()

        if future_avg > historical_avg * 1.1:
            trend = "up"
        elif future_avg < historical_avg * 0.9:
            trend = "down"
        else:
            trend = "stable"

        return {
            "product_id": product.get("id"),
            "product": self._normalize_product(product),

            "forecast": result.to_dict(orient="records"),

            "metrics": {
                "predicted_demand": predicted_demand,
                "avg_daily_demand": avg_daily,
                "confidence_score": confidence,
                "trend": trend
            }
        }

    # =========================
    # HELPERS
    # =========================
    def _normalize_product(self, product):
        return {
            "id": product.get("id"),
            "name": product.get("name"),
            "current_quantity": product.get("current_quantity", 0),
        }

    def _fill_missing_days(self, df):
        df = df.set_index("ds")

        full_range = pd.date_range(
            start=df.index.min(),
            end=df.index.max(),
            freq="D"
        )

        df = df.reindex(full_range)
        df["y"] = df["y"].fillna(0)

        df = df.reset_index()
        df.columns = ["ds", "y"]

        return df

    def _empty_response(self, product):
        return {
            "product_id": product.get("id"),
            "product": self._normalize_product(product),
            "metrics": {
                "predicted_demand": 0,
                "avg_daily_demand": 0,
                "confidence_score": 0,
                "trend": "stable"
            },
            "forecast": []
        }