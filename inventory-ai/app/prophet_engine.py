from asyncio.log import logger

import pandas as pd
from prophet import Prophet
from typing import Dict, Any
import numpy as np


class ProphetEngine:
    """
    Production-ready Forecast Engine (Fixed & Stable)
    """

    def __init__(self):
        self.models = {}

    def predict(
        self,
        product: Dict[str, Any],
        sales_data: pd.DataFrame,
        periods: int = 30
    ) -> Dict[str, Any]:

        # =========================
        # 1. VALIDATION
        # =========================
        if sales_data is None or sales_data.empty:
            return self._empty_response(product)

        if len(sales_data) < 7:
            return {
                "product_id": product.get("id"),
                "product": self._normalize_product(product),
                "forecast": [],
                "metrics": {
                    "predicted_demand": 0,
                    "avg_daily_demand": 0,
                    "confidence_score": 0.0,
                    "trend": "stable"
                },
                "message": "Not enough data (min 7 days required)"
            }

        # =========================
        # 2. CLEAN DATA
        # =========================
        df = sales_data.copy()

        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)
        df["y"] = df["y"].clip(lower=0)

        df = df.dropna(subset=["ds"])
        df = df.groupby("ds", as_index=False)["y"].sum()

        df = self._fill_missing_days(df)

        if df.empty:
            return self._empty_response(product)

        # =========================
        # 3. TRAIN MODEL
        # =========================
        try:
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05
            )

            model.fit(df)

        except Exception:
            return self._empty_response(product)

        # =========================
        # 4. PREDICT
        # =========================
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)

        if result.empty:
            return self._empty_response(product)

        # clean NaN
        result = result.dropna()
        result["yhat"] = result["yhat"].fillna(0).clip(lower=0)
        result["yhat_lower"] = result["yhat_lower"].fillna(0)
        result["yhat_upper"] = result["yhat_upper"].fillna(0)

        # =========================
        # 5. METRICS
        # =========================
        predicted_demand = float(result["yhat"].mean())
        avg_daily = float(result["yhat"].mean())

        # confidence (stable + bounded)
        uncertainty = (result["yhat_upper"] - result["yhat_lower"]).mean()
        scale = result["yhat"].mean() + 1e-6

        confidence = float(np.clip(1 - (uncertainty / scale), 0.1, 1.0))

        # =========================
        # 6. TREND
        # =========================
        historical_avg = df["y"].mean()
        future_avg = result["yhat"].mean()

        if future_avg > historical_avg * 1.1:
            trend = "up"
        elif future_avg < historical_avg * 0.9:
            trend = "down"
        else:
            trend = "stable"

        # =========================
        # 7. RETURN RESULT
        # =========================
        return {
            "product_id": product.get("id"),
            "product": self._normalize_product(product),

            "forecast": result.to_dict(orient="records"),

            "metrics": {
                "predicted_demand": predicted_demand,
                "avg_daily_demand": avg_daily,
                "confidence_score": confidence,
                "trend": trend
            },

            "model_meta": {
                "model": "prophet",
                "periods": periods,
                "data_points": len(df)
            }
        }

    # =========================
    # HELPERS
    # =========================

    def _normalize_product(self, product: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": product.get("id"),
            "name": product.get("name") or product.get("product_name") or "Unknown",
            "sku": product.get("sku") or "N/A",
            "category": product.get("category") or product.get("category_id") or "unknown",
            "current_stock": (
                product.get("current_quantity")
                or product.get("current_stock")
                or 0
            ),
        }

    def _fill_missing_days(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

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

    def _empty_response(self, product: Dict[str, Any]) -> dict:
        return {
            "product_id": product.get("id"),
            "product": self._normalize_product(product),

            "metrics": {
                "predicted_demand": 0,
                "avg_daily_demand": 0,
                "confidence_score": 0.0,
                "trend": "stable"
            },

            "forecast": [],
            "model_meta": {
                "model": "prophet",
                "periods": 0,
                "data_points": 0
            }
        }


# =============================
# ENTRY POINT
# =============================
def _forecast_step(self, context):

    forecast = self.prophet.predict(
        product={
            "id": context.product_id,
            "name": context.name,
            "current_stock": context.current_stock
        },
        sales_data=context.sales_data,
        periods=context.periods
    ) or {}

    context.forecast = forecast

    # ✅ ADD DEBUG LOG HERE (RIGHT AFTER ASSIGNMENT)
    logger.info("FORECAST RAW OUTPUT:")
    logger.info(context.forecast)