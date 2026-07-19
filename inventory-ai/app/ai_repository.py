import logging
from datetime import datetime, date
from sqlalchemy import text

logger = logging.getLogger(__name__)


class AIRepository:

    def __init__(self, db):
        self.db = db

    # =========================================================
    # 1. PREDICTION (UPSERT FIXED)
    # =========================================================
    def save_prediction(self, prediction: dict):

        if not prediction:
            return

        try:
            query = """
            INSERT INTO ai_predictions
(
    product_id,
    product_name,
    predicted_demand,
    current_quantity,
    confidence_score,
    trend,
    recommended_action,
    risk_score,
    forecast_start,
    forecast_end,
    created_at,
    updated_at
)
VALUES
(
    :product_id,
    :product_name,
    :predicted_demand,
    :current_quantity,
    :confidence_score,
    :trend,
    :recommended_action,
    :risk_score,
    :forecast_start,
    :forecast_end,
    :created_at,
    :updated_at
)

ON CONFLICT (product_id)

DO UPDATE SET

product_name = EXCLUDED.product_name,
predicted_demand = EXCLUDED.predicted_demand,
current_quantity = EXCLUDED.current_quantity,
confidence_score = EXCLUDED.confidence_score,
trend = EXCLUDED.trend,
recommended_action = EXCLUDED.recommended_action,
risk_score = EXCLUDED.risk_score,
forecast_start = EXCLUDED.forecast_start,
forecast_end = EXCLUDED.forecast_end,
updated_at = EXCLUDED.updated_at
            """

            now = datetime.utcnow()

            self.db.execute(query, {
                "product_id": prediction.get("product_id"),
                "product_name": prediction.get("product_name"),

                "predicted_demand": int(
                    self._float(prediction.get("predicted_demand"))
                ),

                "current_quantity": int(
                    self._float(
                        prediction.get("current_quantity")
                    )
                ),

                "confidence_score": self._float(
                    prediction.get("confidence_score")
                ),

                "trend": prediction.get("trend", "stable"),

                "recommended_action": prediction.get(
                    "recommended_action"
                ),

                "risk_score": self._float(
                    prediction.get("risk_score")
                ),

                "forecast_start": str(
                    prediction.get("forecast_start") or date.today()
                ),

                "forecast_end": str(
                    prediction.get("forecast_end") or date.today()
                ),

                "created_at": now,
                "updated_at": now
            })

            logger.info(" Prediction upserted")

        except Exception:
            logger.exception("save_prediction failed")
            raise

    # =========================================================
    # 2. INSIGHT (UPSERT FIXED)
    # =========================================================
    def save_insight(self, insight: dict):

        if not insight:
            return

        try:
            query = """
            INSERT INTO ai_insights
(
    product_id,
    product_name,
    message,
    insight_type,
    severity,
    reason_summary,
    created_at,
    updated_at
)
VALUES
(
    :product_id,
    :product_name,
    :message,
    :insight_type,
    :severity,
    :reason_summary,
    :created_at,
    :updated_at
)

ON CONFLICT (product_id)

DO UPDATE SET

product_name = EXCLUDED.product_name,
message = EXCLUDED.message,
insight_type = EXCLUDED.insight_type,
severity = EXCLUDED.severity,
reason_summary = EXCLUDED.reason_summary,
updated_at = EXCLUDED.updated_at
            """

            now = datetime.utcnow()

            self.db.execute(query, {
                "product_id": insight.get("product_id"),
                "product_name": insight.get("product_name"),

                "message": insight.get("message"),

                "insight_type": insight.get(
                    "insight_type",
                    "trend"
                ),

                "severity": insight.get(
                    "severity",
                    "low"
                ),

                "reason_summary": insight.get(
                    "reason_summary",
                    ""
                ),

                "created_at": now,
                "updated_at": now
            })

            logger.info("💡Insight upserted")

        except Exception:
            logger.exception(" save_insight failed")
            raise

    # =========================================================
    # 3. ALERTS (UPSERT FIXED)
    # =========================================================
    def save_alerts(self, alerts: list):

        if not alerts:
            return

        try:
            query = """
            INSERT INTO ai_alerts
(
    product_id,
    product_name,
    alert_type,
    priority,
    alert_message,
    is_resolved,
    created_at,
    updated_at
)
VALUES
(
    :product_id,
    :product_name,
    :alert_type,
    :priority,
    :alert_message,
    :is_resolved,
    :created_at,
    :updated_at
)

ON CONFLICT (product_id, alert_type)

DO UPDATE SET

product_name = EXCLUDED.product_name,
priority = EXCLUDED.priority,
alert_message = EXCLUDED.alert_message,
is_resolved = EXCLUDED.is_resolved,
updated_at = EXCLUDED.updated_at
            """

            seen = set()

            now = datetime.utcnow()

            for alert in alerts:

                key = (
                    alert.get("product_id"),
                    alert.get("alert_type")
                )

                if key in seen:
                    continue

                seen.add(key)

                self.db.execute(query, {
                    "product_id": alert.get("product_id"),
                    "product_name": alert.get("product_name"),

                    "alert_type": alert.get("alert_type"),

                    "priority": alert.get(
                        "priority",
                        "LOW"
                    ),

                    "alert_message": alert.get(
                        "alert_message"
                    ),

                    "is_resolved": False,

                    "created_at": now,
                    "updated_at": now
                })

            logger.info("🚨 Alerts upserted")

        except Exception:
            logger.exception("❌ save_alerts failed")
            raise

    # =========================================================
    # 4. SNAPSHOT (DAILY UPSERT)
    # =========================================================
    def save_snapshot(self, snapshot: dict):

        if not snapshot:
            return

        try:
            query = """
            INSERT INTO ai_snapshots
(
    snapshot_date,
    total_sales,
    total_profit,
    top_product_id,
    low_stock_count,
    out_of_stock_count,
    sales_trend,
    total_predictions_count,
    critical_alerts_count,
    created_at,
    updated_at
)
VALUES
(
    :snapshot_date,
    :total_sales,
    :total_profit,
    :top_product_id,
    :low_stock_count,
    :out_of_stock_count,
    :sales_trend,
    :total_predictions_count,
    :critical_alerts_count,
    :created_at,
    :updated_at
)

ON CONFLICT (snapshot_date)

DO UPDATE SET

total_sales = EXCLUDED.total_sales,
total_profit = EXCLUDED.total_profit,
top_product_id = EXCLUDED.top_product_id,
low_stock_count = EXCLUDED.low_stock_count,
out_of_stock_count = EXCLUDED.out_of_stock_count,
sales_trend = EXCLUDED.sales_trend,
total_predictions_count = EXCLUDED.total_predictions_count,
critical_alerts_count = EXCLUDED.critical_alerts_count,
updated_at = EXCLUDED.updated_at
            """

            now = datetime.utcnow()

            self.db.execute(query, {
                "snapshot_date": str(
                    snapshot.get("snapshot_date", date.today())
                ),

                "total_sales": self._float(
                    snapshot.get("total_sales")
                ),

                "total_profit": self._float(
                    snapshot.get("total_profit")
                ),

                "top_product_id": snapshot.get(
                    "top_product_id"
                ),

                "low_stock_count": snapshot.get(
                    "low_stock_count",
                    0
                ),

                "out_of_stock_count": snapshot.get(
                    "out_of_stock_count",
                    0
                ),

                "sales_trend": snapshot.get(
                    "sales_trend",
                    "stable"
                ),

                "total_predictions_count": snapshot.get(
                    "total_predictions_count",
                    0
                ),

                "critical_alerts_count": snapshot.get(
                    "critical_alerts_count",
                    0
                ),

                "created_at": now,
                "updated_at": now
            })

            logger.info("Snapshot upserted")

        except Exception:
            logger.exception("save_snapshot failed")
            raise

    # =========================================================
    # SAFE FLOAT
    # =========================================================
    def _float(self, value):

        try:
            return float(value)

        except Exception:
            return 0.0