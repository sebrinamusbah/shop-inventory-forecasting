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
    # JOB: DEMO AI
    # =========================
    def run_demo_ai(self):

        try:
            self.logger.info(f"⚡ DEMO RUN START: {datetime.now()}")

            product_ids = self.db.get_all_product_ids()

            if not product_ids:
                self.logger.warning("⚠️ No products found")
                return

            for pid in product_ids:

                context = self.pipeline.run(pid)

                if not context:
                    continue

                # SAVE RESULTS
                if context.prediction_result:
                    self.repo.save_prediction(context.prediction_result)

                if context.insight_result:
                    self.repo.save_insight(context.insight_result)

                if context.alerts_result:
                    self.repo.save_alerts(context.alerts_result)

                action = (
                    context.decision.get("action")
                    if isinstance(context.decision, dict)
                    else None
                )

                self.logger.info(f"[DEMO] Product {pid} → {action}")

            self.logger.info("✅ DEMO RUN COMPLETE")

        except Exception as e:
            self.logger.exception(f"❌ Demo error: {e}")

    # =========================
    # JOB: DAILY SNAPSHOT
    # =========================
    def run_daily_snapshot(self):

        try:
            self.logger.info(f"📊 DAILY SNAPSHOT START: {datetime.now()}")

            product_ids = self.db.get_all_product_ids()

            if not product_ids:
                self.logger.warning("⚠️ No products found")
                return

            total_sales = 0.0
            total_profit = 0.0
            low_stock_count = 0
            critical_alerts_count = 0
            product_scores = []

            for pid in product_ids:

                context = self.pipeline.run(pid)

                if not context:
                    continue

                pred = context.prediction_result or {}

                demand = float(pred.get("predicted_demand", 0))
                stock = float(pred.get("current_stock", 0))

                # OPTIONAL (only if implemented)
                if hasattr(self.db, "get_product_sales"):
                    total_sales += self.db.get_product_sales(pid)

                if hasattr(self.db, "get_product_profit"):
                    total_profit += self.db.get_product_profit(pid)

                if stock < 10:
                    low_stock_count += 1

                product_scores.append((pid, demand))

                for a in (context.alerts_result or []):
                    if a.get("priority") == "HIGH":
                        critical_alerts_count += 1

                # SAVE
                self.repo.save_prediction(context.prediction_result)
                self.repo.save_insight(context.insight_result)
                self.repo.save_alerts(context.alerts_result)

            top_product_id = (
                max(product_scores, key=lambda x: x[1])[0]
                if product_scores else None
            )

            snapshot = {
                "snapshot_date": datetime.now().date(),
                "total_sales": total_sales,
                "total_profit": total_profit,
                "top_product_id": top_product_id,
                "low_stock_count": low_stock_count,
                "out_of_stock_count": 0,
                "sales_trend": "stable",
                "total_predictions_count": len(product_ids),
                "critical_alerts_count": critical_alerts_count
            }

            self.repo.save_snapshot(snapshot)

            self.logger.info("✅ DAILY SNAPSHOT COMPLETE")

        except Exception as e:
            self.logger.exception(f"❌ Snapshot error: {e}")

    # =========================
    # REGISTER JOBS
    # =========================
    def start_interval(self, minutes=10):

        self.scheduler.add_job(
            self.run_demo_ai,
            trigger="interval",
            minutes=minutes,
            id="demo_job",
            replace_existing=True,
            misfire_grace_time=600,   # allow delay
            max_instances=1
        )

        self.logger.info(f"📌 Demo job registered every {minutes} minutes")

    def start_daily(self, run_hour=2):

        self.scheduler.add_job(
            self.run_daily_snapshot,
            trigger="cron",
            hour=run_hour,
            minute=0,
            id="daily_job",
            replace_existing=True,
            misfire_grace_time=3600,
            max_instances=1
        )

        self.logger.info(f"📌 Daily job registered at {run_hour}:00")

    # =========================
    # START
    # =========================
    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            self.logger.info("🚀 Scheduler STARTED")

    # =========================
    # STOP
    # =========================
    def stop(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            self.logger.info("🛑 Scheduler STOPPED")