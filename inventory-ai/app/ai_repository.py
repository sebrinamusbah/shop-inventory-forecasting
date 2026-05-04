import logging
from datetime import date, datetime, timedelta

logger = logging.getLogger(__name__)


class AIRepository:

    def __init__(self, db):
        self.db = db

    # =========================
    # 1. PREDICTIONS
    # =========================
    def save_prediction(self, prediction: dict):

        try:
            # ✅ SAFETY DEFAULTS (prevents DB crash)
            forecast_start = prediction.get("forecast_start")
            if not forecast_start:
                forecast_start = date.today()

            forecast_end = prediction.get("forecast_end")
            if not forecast_end:
                forecast_end = date.today() + timedelta(days=7)

            query = """
            INSERT INTO ai_predictions
            (product_id, product_name, predicted_demand, current_stock,
             confidence_score, recommended_action, risk_score, trend,
             forecast_start, forecast_end, generated_at)
            VALUES (:product_id, :product_name, :predicted_demand, :current_stock,
                    :confidence_score, :recommended_action, :risk_score, :trend,
                    :forecast_start, :forecast_end, :generated_at)
            """

            self.db.execute(query, {
                "product_id": prediction.get("product_id"),
                "product_name": prediction.get("product_name"),
                "predicted_demand": prediction.get("predicted_demand", 0),
                "current_stock": prediction.get("current_stock", 0),
                "confidence_score": prediction.get("confidence_score", 0),
                "recommended_action": prediction.get("recommended_action"),
                "risk_score": prediction.get("risk_score", 0),
                "trend": prediction.get("trend", "stable"),

                "forecast_start": forecast_start,
                "forecast_end": forecast_end,
                "generated_at": datetime.utcnow()
            })

            logger.info("✅ Prediction saved successfully")

        except Exception:
            logger.exception("❌ save_prediction failed")

    # =========================
    # 2. INSIGHTS
    # =========================
    def save_insight(self, insight: dict):

        try:
            query = """
            INSERT INTO ai_insights
            (product_id, product_name, message, insight_type,
             severity, reason_summary, created_at)
            VALUES (:product_id, :product_name, :message, :insight_type,
                    :severity, :reason_summary, :created_at)
            """

            self.db.execute(query, {
                "product_id": insight.get("product_id"),
                "product_name": insight.get("product_name"),
                "message": insight.get("message"),
                "insight_type": insight.get("insight_type"),
                "severity": insight.get("severity"),
                "reason_summary": insight.get("reason_summary"),
                "created_at": datetime.utcnow()
            })

            logger.info("💡 Insight saved successfully")

        except Exception:
            logger.exception("❌ save_insight failed")

    # =========================
    # 3. ALERTS
    # =========================
    def save_alerts(self, alerts: list):

        try:
            query = """
            INSERT INTO ai_alerts
            (product_id, product_name, alert_message,
             alert_type, priority, is_resolved, created_at)
            VALUES (:product_id, :product_name, :alert_message,
                    :alert_type, :priority, :is_resolved, :created_at)
            """

            for alert in alerts:

                self.db.execute(query, {
                    "product_id": alert.get("product_id"),
                    "product_name": alert.get("product_name"),
                    "alert_message": alert.get("alert_message"),
                    "alert_type": alert.get("alert_type"),
                    "priority": alert.get("priority", "low"),
                    "is_resolved": False,
                    "created_at": datetime.utcnow()
                })

            logger.info("🚨 Alerts saved successfully")

        except Exception:
            logger.exception("❌ save_alerts failed")

    # =========================
    # 4. SNAPSHOT
    # =========================
    def save_snapshot(self, snapshot: dict):

        try:
            query = """
            INSERT INTO ai_snapshots
            (snapshot_date, total_sales, total_profit,
             top_product_id, top_product_name,
             low_stock_count, out_of_stock_count,
             sales_trend, total_predictions_count,
             critical_alerts_count, created_at)
            VALUES (:snapshot_date, :total_sales, :total_profit,
                    :top_product_id, :top_product_name,
                    :low_stock_count, :out_of_stock_count,
                    :sales_trend, :total_predictions_count,
                    :critical_alerts_count, :created_at)
            """

            self.db.execute(query, {
                # ✅ safer than datetime if column is DATE
                "snapshot_date": date.today(),

                "total_sales": snapshot.get("total_sales", 0),
                "total_profit": snapshot.get("total_profit", 0),
                "top_product_id": snapshot.get("top_product_id"),
                "top_product_name": snapshot.get("top_product_name"),
                "low_stock_count": snapshot.get("low_stock_count", 0),
                "out_of_stock_count": snapshot.get("out_of_stock_count", 0),
                "sales_trend": snapshot.get("sales_trend", "stable"),
                "total_predictions_count": snapshot.get("total_predictions_count", 0),
                "critical_alerts_count": snapshot.get("critical_alerts_count", 0),
                "created_at": datetime.utcnow()
            })

            logger.info("📊 Snapshot saved successfully")

        except Exception:
            logger.exception("❌ save_snapshot failed")