from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import logging

from app.ai_repository import AIRepository


class InventoryScheduler:

    def __init__(self, pipeline, db):
        self.pipeline = pipeline
        self.db = db

        self.repo = AIRepository(db)
        self.scheduler = BackgroundScheduler()
        self.logger = logging.getLogger("InventoryScheduler")

    # =========================
    # DEMO MODE
    # =========================
    def run_demo_ai(self):

        try:
            self.logger.info(f"⚡ DEMO RUN: {datetime.now()}")

            product_ids = self.db.get_all_product_ids()

            for pid in product_ids:

                context = self.pipeline.run(pid)

                # ✅ SAVE CORRECT STRUCTURE
                self.repo.save_prediction(context.prediction_result)
                self.repo.save_insight(context.insight_result)
                self.repo.save_alerts(context.alerts_result)

                action = context.decision.get("action") if isinstance(context.decision, dict) else None
                self.logger.info(f"[DEMO] Product {pid} → {action}")

        except Exception as e:
            self.logger.error(f"Demo error: {e}")

    # =========================
    # DAILY SNAPSHOT
    # =========================
    def run_daily_snapshot(self):

        try:
            self.logger.info(f"📊 DAILY SNAPSHOT: {datetime.now()}")

            product_ids = self.db.get_all_product_ids()

            total_sales = 0
            total_profit = 0
            low_stock_count = 0
            critical_alerts_count = 0
            product_scores = []

            for pid in product_ids:

                context = self.pipeline.run(pid)

                pred = context.prediction_result

                demand = pred.get("predicted_demand", 0)
                action = pred.get("recommended_action")

                total_sales += demand
                total_profit += demand * 0.25

                if action == "RESTOCK":
                    low_stock_count += 1

                product_scores.append((pid, demand))

                # optional: count critical alerts
                for a in context.alerts_result:
                    if a.get("priority") == "critical":
                        critical_alerts_count += 1

                # SAVE PRODUCT LEVEL DATA
                self.repo.save_prediction(pred)
                self.repo.save_insight(context.insight_result)
                self.repo.save_alerts(context.alerts_result)

            top_product_id = (
                max(product_scores, key=lambda x: x[1])[0]
                if product_scores else None
            )

            sales_trend = (
                "up" if total_sales > 10000
                else "down" if total_sales < 5000
                else "stable"
            )

            snapshot = {
                "snapshot_date": datetime.now().date(),
                "total_sales": total_sales,
                "total_profit": total_profit,
                "top_product_id": top_product_id,
                "low_stock_count": low_stock_count,
                "out_of_stock_count": 0,
                "sales_trend": sales_trend,
                "total_predictions_count": len(product_ids),
                "critical_alerts_count": critical_alerts_count
            }

            self.repo.save_snapshot(snapshot)

            self.logger.info("✅ Daily snapshot saved")

        except Exception as e:
            self.logger.error(f"Snapshot error: {e}")

    # =========================
    # START DEMO
    # =========================
    def start_interval(self, minutes=5):

        self.scheduler.add_job(
            self.run_demo_ai,
            trigger="interval",
            minutes=minutes,
            id="demo_job",
            replace_existing=True
        )

        self.scheduler.start()

        self.logger.info(f"🚀 DEMO MODE → every {minutes} minutes")

    # =========================
    # START PRODUCTION
    # =========================
    def start_daily(self, run_hour=2):

        self.scheduler.add_job(
            self.run_daily_snapshot,
            trigger="cron",
            hour=run_hour,
            minute=0,
            id="daily_job",
            replace_existing=True
        )

        self.scheduler.start()

        self.logger.info(f"🏭 PRODUCTION MODE → daily at {run_hour}:00")

    # =========================
    # STOP
    # =========================
    def stop(self):
        self.scheduler.shutdown()
        self.logger.info("🛑 Scheduler stopped")