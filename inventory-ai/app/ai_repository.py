import logging
from datetime import datetime, date
from sqlalchemy import text

logger = logging.getLogger(__name__)


class AIRepository:

    def __init__(self, db):
        self.db = db

    # =========================================================
    # 1. PREDICTION (FIXED)
    # =========================================================
    def save_prediction(self, prediction: dict):

        if not prediction:
            return

        try:
            query = """
            INSERT INTO ai_predictions
            (product_id, product_name, predicted_demand,
             avg_daily_demand, current_quantity,
             confidence_score, trend,
             recommended_action, risk_score,
             forecast_start, forecast_end,
             created_at)
            VALUES
            (:product_id, :product_name, :predicted_demand,
             :avg_daily_demand, :current_quantity,
             :confidence_score, :trend,
             :recommended_action, :risk_score,
             :forecast_start, :forecast_end,
             :created_at)
            """

            self.db.execute(query, {
                "product_id": prediction.get("product_id"),
                "product_name": prediction.get("product_name"),

                "predicted_demand": self._float(prediction.get("predicted_demand")),
                "avg_daily_demand": self._float(prediction.get("avg_daily_demand")),
                "current_quantity": self._float(prediction.get("current_quantity")),

                "confidence_score": self._float(prediction.get("confidence_score")),
                "trend": prediction.get("trend", "stable"),

                "recommended_action": prediction.get("recommended_action"),
                "risk_score": self._float(prediction.get("risk_score")),

                "forecast_start": str(prediction.get("forecast_start") or date.today()),
                "forecast_end": str(prediction.get("forecast_end") or date.today()),

                "created_at": datetime.utcnow()
            })

            logger.info("✅ Prediction saved")

        except Exception:
            logger.exception("❌ save_prediction failed")
            raise

    # =========================================================
    # 2. INSIGHT (FIXED)
    # =========================================================
    def save_insight(self, insight: dict):

        if not insight:
            return

        try:
            query = """
            INSERT INTO ai_insights
            (product_id, product_name, message,
             insight_type, severity, reason_summary,
             created_at)
            VALUES
            (:product_id, :product_name, :message,
             :insight_type, :severity, :reason_summary,
             :created_at)
            """

            self.db.execute(query, {
                "product_id": insight.get("product_id"),
                "product_name": insight.get("product_name"),
                "message": insight.get("message"),
                "insight_type": insight.get("insight_type", "info"),
                "severity": insight.get("severity", "low"),
                "reason_summary": insight.get("reason_summary", ""),
                "created_at": datetime.utcnow()
            })

            logger.info("💡 Insight saved")

        except Exception:
            logger.exception("❌ save_insight failed")
            raise

    # =========================================================
    # 3. ALERTS (FIXED + SAFE + NO DUPLICATES)
    # =========================================================
    def save_alerts(self, alerts: list):

        if not alerts:
            return

        try:
            query = """
            INSERT INTO ai_alerts
            (product_id, product_name, alert_type,
             priority, alert_message, is_resolved,
             created_at)
            VALUES
            (:product_id, :product_name, :alert_type,
             :priority, :alert_message, :is_resolved,
             :created_at)
            """

            seen = set()

            with self.db.transaction() as conn:

                for alert in alerts:

                    key = (
                        alert.get("product_id"),
                        alert.get("alert_type"),
                        alert.get("alert_message")
                    )

                    if key in seen:
                        continue

                    seen.add(key)

                    conn.execute(text(query), {
                        "product_id": alert.get("product_id"),
                        "product_name": alert.get("product_name"),
                        "alert_type": alert.get("alert_type"),
                        "priority": alert.get("priority", "LOW"),
                        "alert_message": alert.get("alert_message"),
                        "is_resolved": False,
                        "created_at": datetime.utcnow()
                    })

            logger.info("🚨 Alerts saved")

        except Exception:
            logger.exception("❌ save_alerts failed")
            raise

    # =========================================================
    # 4. SNAPSHOT (FIXED)
    # =========================================================
    def save_snapshot(self, snapshot: dict):

        if not snapshot:
            return

        try:
            query = """
            INSERT INTO ai_snapshots
            (snapshot_date, total_sales, total_profit,
             top_product_id,
             low_stock_count, out_of_stock_count,
             sales_trend,
             total_predictions_count,
             critical_alerts_count,
             created_at)
            VALUES
            (:snapshot_date, :total_sales, :total_profit,
             :top_product_id,
             :low_stock_count, :out_of_stock_count,
             :sales_trend,
             :total_predictions_count,
             :critical_alerts_count,
             :created_at)
            """

            self.db.execute(query, {
                "snapshot_date": str(snapshot.get("snapshot_date", date.today())),
                "total_sales": self._float(snapshot.get("total_sales")),
                "total_profit": self._float(snapshot.get("total_profit")),
                "top_product_id": snapshot.get("top_product_id"),
                "low_stock_count": snapshot.get("low_stock_count", 0),
                "out_of_stock_count": snapshot.get("out_of_stock_count", 0),
                "sales_trend": snapshot.get("sales_trend", "stable"),
                "total_predictions_count": snapshot.get("total_predictions_count", 0),
                "critical_alerts_count": snapshot.get("critical_alerts_count", 0),
                "created_at": datetime.utcnow()
            })

            logger.info("📊 Snapshot saved")

        except Exception:
            logger.exception("❌ save_snapshot failed")
            raise

    # =========================================================
    # SAFE FLOAT
    # =========================================================
    def _float(self, value):
        try:
            return float(value)
        except:
            return 0.0