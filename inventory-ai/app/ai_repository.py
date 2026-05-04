import logging
from datetime import date, timedelta

logger = logging.getLogger(__name__)


class AIRepository:

    def __init__(self, db):
        self.db = db

    # ==================================================
    # 1. SAVE PREDICTION
    # ==================================================
    def save_prediction(self, context, forecast_type="30d"):

        try:
            forecast = context.forecast or {}

            # supports BOTH formats safely
            metrics = forecast.get("metrics") if isinstance(forecast.get("metrics"), dict) else {}

            predicted_demand = (
                metrics.get("predicted_demand")
                or forecast.get("predicted_demand")
                or 0
            )

            confidence = (
                metrics.get("confidence_score")
                or forecast.get("confidence_score")
                or 0
            )

            action = getattr(context.decision, "action", None)

            today = date.today()

            query = """
            INSERT INTO ai_predictions
            (product_id, forecast_type, predicted_demand, confidence_score,
             recommended_action, forecast_start, forecast_end)
            VALUES (:product_id, :forecast_type, :predicted_demand,
                    :confidence_score, :recommended_action,
                    :forecast_start, :forecast_end)
            """

            params = {
                "product_id": context.product_id,
                "forecast_type": forecast_type,
                "predicted_demand": int(predicted_demand or 0),
                "confidence_score": float(confidence or 0),
                "recommended_action": action,
                "forecast_start": today,
                "forecast_end": today + timedelta(days=30)
            }

            self.db.execute(query, params)

            logger.info(f"✅ Prediction saved for product {context.product_id}")

        except Exception:
            logger.exception("❌ save_prediction failed")

    # ==================================================
    # 2. SAVE INSIGHT
    # ==================================================
    def save_insight(self, context):

        try:
            message = context.explanation or "No explanation available"

            risk_score = getattr(context.risk, "risk_score", 0) or 0

            if risk_score > 0.4:
                severity = "high"
            elif risk_score > 0.25:
                severity = "medium"
            else:
                severity = "low"

            action = getattr(context.decision, "action", None)

            if action == "RESTOCK":
                insight_type = "opportunity"
            elif action == "DROP":
                insight_type = "drop"
            else:
                insight_type = "warning"

            query = """
            INSERT INTO ai_insights
            (product_id, type, message, severity)
            VALUES (:product_id, :type, :message, :severity)
            """

            params = {
                "product_id": context.product_id,
                "type": insight_type,
                "message": message,
                "severity": severity
            }

            self.db.execute(query, params)

            logger.info(f"💡 Insight saved for product {context.product_id}")

        except Exception:
            logger.exception("❌ save_insight failed")

    # ==================================================
    # 3. SAVE SNAPSHOT
    # ==================================================
    def save_snapshot(self, snapshot_data: dict):

        try:
            query = """
            INSERT INTO ai_snapshots
            (snapshot_date, total_sales, total_profit,
             top_product_id, low_stock_count, sales_trend)
            VALUES (:snapshot_date, :total_sales, :total_profit,
                    :top_product_id, :low_stock_count, :sales_trend)
            """

            params = {
                "snapshot_date": date.today(),
                "total_sales": float(snapshot_data.get("total_sales", 0)),
                "total_profit": float(snapshot_data.get("total_profit", 0)),
                "top_product_id": snapshot_data.get("top_product_id"),
                "low_stock_count": int(snapshot_data.get("low_stock_count", 0)),
                "sales_trend": snapshot_data.get("sales_trend", "stable")
            }

            self.db.execute(query, params)

            logger.info("📊 Snapshot saved successfully")

        except Exception:
            logger.exception("❌ save_snapshot failed")