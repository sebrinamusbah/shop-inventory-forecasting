from app.ai.core.inventory_context import InventoryContext
from datetime import date, timedelta
import logging
import pandas as pd

logger = logging.getLogger(__name__)


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

    # =============================
    # RUN PIPELINE
    # =============================
    def run(self, product_id: int, periods: int = 30):

        product = self.db.get_product_by_id(product_id)
        if not product:
            raise ValueError("Product not found")

        raw_sales = self.db.get_sales_history_cached(product_id)

        # ✅ FIX 1: safe empty check for DataFrame OR list
        if raw_sales is None:
            logger.warning(f"No sales data for product {product_id}")
            return None

        if isinstance(raw_sales, pd.DataFrame):
            if raw_sales.empty or len(raw_sales) < 3:
                logger.warning(f"Not enough sales data for product {product_id}")
                return None
        else:
            if len(raw_sales) < 3:
                logger.warning(f"Not enough sales data for product {product_id}")
                return None

        # ✅ FIX 2: ALWAYS convert safely to DataFrame and normalize data format
        raw_df = raw_sales if isinstance(raw_sales, pd.DataFrame) else pd.DataFrame(raw_sales)
        sales_data = self._prepare_sales_data(raw_df)

        context = InventoryContext(
            product_id=product_id,
            sku=product.get("sku"),
            name=product.get("name"),
            category=product.get("category_id")
        )

        context.sales_data = sales_data
        context.current_stock = product.get("current_quantity", 0)
        context.periods = periods

        for step in self.steps:
            self._execute_step(step, context)

        return context

    # =============================
    def _execute_step(self, step, context):
        try:
            step(context)
        except Exception as e:
            context.add_error(step.__name__, str(e))
            logger.exception(f"Step failed: {step.__name__}")

    # =============================
    # FORECAST
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
        )

        context.forecast = forecast or {}

    # =============================
    # DECISION
    # =============================
    def _decision_step(self, context):
        context.decision = self.decision.evaluate(context.forecast) or {}

    # =============================
    # RISK
    # =============================
    def _risk_step(self, context):
        context.risk = self.risk.evaluate(context.forecast) or {}

    # =============================
    # INSIGHT
    # =============================
    def _explanation_step(self, context):

        message = self.explainer.explain(
            context.forecast,
            context.decision
        )

        context.insight_result = {
            "product_id": context.product_id,
            "product_name": context.name,
            "message": message,
            "insight_type": self._get_insight_type(context),
            "severity": self._get_severity(context),
            "reason_summary": (
                context.decision.get("reason")
                or context.risk.get("risk_level")
                or "AI-generated insight"
            )
        }

    # =============================
    # ALERTS
    # =============================
    def _alerts_step(self, context):

        alerts = self.alerts.generate_alerts(
            context.forecast,
            context.decision,
            context.risk
        ) or []

        context.alerts_result = [
            {
                "product_id": context.product_id,
                "product_name": context.name,
                "alert_type": a.get("type"),
                "priority": a.get("priority"),
                "alert_message": a.get("message")
            }
            for a in alerts
        ]

    # =============================
    # FINAL OUTPUT
    # =============================
    def _build_outputs_step(self, context):

        metrics = context.forecast.get("metrics", {})

        context.prediction_result = {
            "product_id": context.product_id,
            "product_name": context.name,

            "predicted_demand": float(metrics.get("predicted_demand", 0)),
            "avg_daily_demand": float(metrics.get("avg_daily_demand", 0)),
            "confidence_score": float(metrics.get("confidence_score", 0)),
            "trend": metrics.get("trend", "stable"),

            "current_stock": context.current_stock,
            "recommended_action": context.decision.get("action"),
            "risk_score": context.risk.get("risk_score", 0),

            "forecast_start": str(date.today()),
            "forecast_end": str(date.today() + timedelta(days=context.periods))
        }

    # =============================
    # SAVE
    # =============================
    def _persist_step(self, context):

        if not getattr(context, "prediction_result", None):
            logger.warning("Skipping DB save: invalid prediction")
            return

        self.repo.save_prediction(context.prediction_result)
        self.repo.save_insight(context.insight_result)
        self.repo.save_alerts(context.alerts_result)

    # =============================
    # DATA CLEANING
    # =============================
    def _prepare_sales_data(self, raw_sales):

        df = pd.DataFrame(raw_sales)

        if df.empty:
            return pd.DataFrame(columns=["ds", "y"])

        # =========================
        # ✅ HANDLE BOTH CASES
        # =========================

        # Case 1: Already formatted from DB (ds, y)
        if "ds" in df.columns and "y" in df.columns:
            df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

        # Case 2: Raw format (created_at, quantity)
        elif "created_at" in df.columns:
            df["ds"] = pd.to_datetime(df["created_at"], errors="coerce")

            if "quantity" in df.columns:
                df["y"] = pd.to_numeric(df["quantity"], errors="coerce")
            elif "total_amount" in df.columns:
                df["y"] = pd.to_numeric(df["total_amount"], errors="coerce")
            else:
                df["y"] = 1

        else:
            raise ValueError(f"Unsupported sales data format: {df.columns}")

        # =========================
        # CLEAN
        # =========================
        df = df.dropna(subset=["ds"])
        df = df.groupby("ds", as_index=False)["y"].sum()
        df = df.sort_values("ds").reset_index(drop=True)

        return df

    # =============================
    # HELPERS
    # =============================
    def _get_insight_type(self, context):
        action = context.decision.get("action")

        if action == "EMERGENCY_RESTOCK":
            return "warning"
        elif action == "RESTOCK":
            return "opportunity"
        return "trend"

    def _get_severity(self, context):
        risk = context.risk.get("risk_score", 0)

        if risk > 0.7:
            return "high"
        elif risk > 0.4:
            return "medium"
        return "low"