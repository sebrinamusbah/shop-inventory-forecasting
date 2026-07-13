
from app.ai.core.inventory_context import InventoryContext
from datetime import date, timedelta, datetime
import logging
import pandas as pd
import requests
import os

logger = logging.getLogger(__name__)
LARAVEL_URL = os.getenv("LARAVEL_URL")


class InventoryPipeline:

    def __init__(self, db, prophet, decision, risk, explainer, alerts, repo):
        self.db = db
        self.prophet = prophet
        self.decision = decision
        self.risk = risk
        self.explainer = explainer
        self.alerts = alerts
        self.repo = repo

        self.steps = [
            self._forecast_step,
            self._decision_step,
            self._risk_step,
            self._explanation_step,
            self._alerts_step,
            self._build_outputs_step,
            self._persist_step
        ]

    # =========================================================
    # RUN PIPELINE
    # =========================================================
    def run(self, product_id: int, periods: int = 30):

        product = self.db.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")

        raw_sales = self.db.get_sales_history_cached(product_id)

        if raw_sales is None or (
            isinstance(raw_sales, list) and len(raw_sales) < 3
        ) or (
            isinstance(raw_sales, pd.DataFrame) and raw_sales.empty
        ):
            logger.warning(f"Not enough sales data for product {product_id}")
            return None

        raw_df = raw_sales if isinstance(raw_sales, pd.DataFrame) else pd.DataFrame(raw_sales)
        sales_data = self._prepare_sales_data(raw_df)

        context = InventoryContext(
            product_id=product_id,
            sku=product.get("sku"),
            name=product.get("name"),
            category=product.get("category_id")
        )

        context.sales_data = sales_data
        context.current_quantity = product.get("current_quantity", 0)
        context.periods = periods

        for step in self.steps:
            self._execute_step(step, context)

        return getattr(context, "final_output", None)

    # =========================================================
    def _execute_step(self, step, context):
        try:
            step(context)
        except Exception as e:
            context.add_error(step.__name__, str(e))
            logger.exception(f"Step failed: {step.__name__}")

    # =========================================================
    # FORECAST
    # =========================================================
    def _forecast_step(self, context):

        context.forecast = self.prophet.predict(
            product={
                "id": context.product_id,
                "name": context.name,
                "current_quantity": context.current_quantity
            },
            sales_data=context.sales_data,
            periods=context.periods
        ) or {}

    # =========================================================
    # DECISION
    # =========================================================
    def _decision_step(self, context):

        context.decision = self.decision.evaluate(context.forecast) or {}

    # =========================================================
    # RISK
    # =========================================================
    def _risk_step(self, context):

        context.risk = self.risk.evaluate(context.forecast) or {}

    # =========================================================
    # INSIGHT
    # =========================================================
    def _explanation_step(self, context):

        context.insight_result = self.explainer.explain(
            context.forecast,
            context.decision
        ) or {
            "product_id": context.product_id,
            "product_name": context.name,
            "message": "No insight available",
            "insight_type": "info",
            "severity": "low",
            "reason_summary": ""
        }

    # =========================================================
    # ALERTS (FIXED - NO DUPLICATES)
    # =========================================================
    def _alerts_step(self, context):

        alerts = self.alerts.generate_alerts(
            context.forecast,
            context.decision,
            context.risk
        ) or []

        cleaned = []
        seen = set()

        for a in alerts:

            key = (
                context.product_id,
                a.get("alert_type"),
                a.get("alert_message")
            )

            if key in seen:
                continue

            seen.add(key)

            cleaned.append({
                "product_id": context.product_id,
                "product_name": context.name,
                "alert_type": a.get("alert_type", "UNKNOWN"),
                "priority": a.get("priority", "LOW"),
                "alert_message": a.get("alert_message", "")
            })

        context.alerts_result = cleaned

    # =========================================================
    # FINAL OUTPUT (CLEAN + STABLE)
    # =========================================================
    def _build_outputs_step(self, context):

        metrics = context.forecast.get("metrics", {})

        predicted = float(metrics.get("predicted_demand", 0))
        avg_daily = float(metrics.get("avg_daily_demand") or predicted / max(context.periods, 1))

        forecast_list = context.forecast.get("forecast") or []

        forecast_end = (
            str(forecast_list[-1].get("ds"))
            if forecast_list else
            str(date.today() + timedelta(days=context.periods))
        )

        context.prediction_result = {
            "product_id": context.product_id,
            "product_name": context.name,
            "predicted_demand": predicted,
            "avg_daily_demand": avg_daily,
            "current_quantity": float(context.current_quantity),
            "confidence_score": float(metrics.get("confidence_score", 0)),
            "trend": metrics.get("trend", "stable"),
            "recommended_action": context.decision.get("action"),
            "risk_score": float((context.risk or {}).get("risk_score", 0)),
            "forecast_start": str(date.today()),
            "forecast_end": forecast_end
        }

        context.final_output = {
            "prediction_result": context.prediction_result,
            "insight_result": context.insight_result,
            "alerts_result": context.alerts_result,
            "meta": {
                "product_id": context.product_id,
                "generated_at": str(datetime.utcnow()),
                "periods": context.periods
            }
        }

    # =========================================================
    # PERSIST (SAFE)
    # =========================================================
    def _persist_step(self, context):

        if not getattr(context, "prediction_result", None):
            logger.warning("Skipping DB save: invalid prediction")
            return

        try:
            self.repo.save_prediction(context.prediction_result)
            self.repo.save_insight(context.insight_result)

            if context.alerts_result:
                self.repo.save_alerts(context.alerts_result)

          

            try:
                requests.post(
    f"{LARAVEL_URL}/api/ai-updated",
    json={
        "prediction": context.prediction_result,
        "insight": context.insight_result,
        "alerts": context.alerts_result,
    },
    timeout=5,
)
            except Exception as e:
                logger.warning(f"Laravel webhook failed: {e}")

        except Exception as e:
            logger.exception("DB save failed")
            raise

    # =========================================================
    # DATA CLEANING
    # =========================================================
    def _prepare_sales_data(self, raw_sales):

        df = pd.DataFrame(raw_sales)

        if df.empty:
            return pd.DataFrame(columns=["ds", "y"])

        if "ds" in df.columns and "y" in df.columns:
            df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

        elif "created_at" in df.columns:
            df["ds"] = pd.to_datetime(df["created_at"], errors="coerce")
            df["y"] = pd.to_numeric(df.get("quantity", 1), errors="coerce")

        else:
            raise ValueError(f"Unsupported sales format: {df.columns}")

        df = df.dropna(subset=["ds"])
        df = df.groupby("ds", as_index=False)["y"].sum()
        df = df.sort_values("ds").reset_index(drop=True)

        return df