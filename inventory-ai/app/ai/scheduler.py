from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, date
import logging


class InventoryScheduler:

    def __init__(self, pipeline, db, repo):
        self.pipeline = pipeline
        self.db = db
        self.repo = repo

        self.scheduler = BackgroundScheduler()
        self.logger = logging.getLogger("InventoryScheduler")

    # =========================================================
    # DEMO RUN (FAST TESTING)
    # =========================================================
    def run_demo_ai(self):

        try:
            self.logger.info(f"⚡ DEMO RUN START: {datetime.now()}")

            product_ids = self.db.get_all_product_ids() or []

            if not product_ids:
                self.logger.warning("⚠️ No products found")
                return

            for pid in product_ids:

                result = self.pipeline.run(pid)

                if not result:
                    continue

                action = result.get("prediction_result", {}).get("recommended_action")

                self.logger.info(f"[DEMO] Product {pid} → {action}")

            self.logger.info("✅ DEMO RUN COMPLETE")

        except Exception as e:
            self.logger.exception(f"❌ Demo error: {e}")

    # =========================================================
    # DAILY SNAPSHOT (ANALYTICS ONLY)
    # =========================================================
    def run_daily_snapshot(self):

        try:
            self.logger.info(f"📊 DAILY SNAPSHOT START: {datetime.now()}")

            product_ids = self.db.get_all_product_ids() or []

            if not product_ids:
                self.logger.warning("⚠️ No products found")
                return

            total_sales = 0.0
            total_profit = 0.0
            low_stock_count = 0
            out_of_stock_count = 0
            critical_alerts_count = 0
            product_scores = []

            for pid in product_ids:

                result = self.pipeline.run(pid)
                if not result:
                    continue

                pred = result.get("prediction_result", {})

                demand = float(pred.get("predicted_demand", 0))
                stock = float(pred.get("current_quantity", 0))

                # safe DB aggregation
                total_sales += self.db.get_product_sales(pid) if hasattr(self.db, "get_product_sales") else 0
                total_profit += self.db.get_product_profit(pid) if hasattr(self.db, "get_product_profit") else 0

                if stock < 10:
                    low_stock_count += 1

                if stock <= 0:
                    out_of_stock_count += 1

                product_scores.append((pid, demand))

                # alerts count
                for a in result.get("alerts_result", []):
                    if a.get("priority") == "HIGH":
                        critical_alerts_count += 1

            top_product_id = (
                max(product_scores, key=lambda x: x[1])[0]
                if product_scores else None
            )

            snapshot = {
                "snapshot_date": str(date.today()),  # FIXED
                "total_sales": total_sales,
                "total_profit": total_profit,
                "top_product_id": top_product_id,
                "top_product_name": None,
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
                "sales_trend": "stable",
                "total_predictions_count": len(product_ids),
                "critical_alerts_count": critical_alerts_count
            }

            self.repo.save_snapshot(snapshot)

            self.logger.info("✅ DAILY SNAPSHOT COMPLETE")

        except Exception as e:
            self.logger.exception(f"❌ Snapshot error: {e}")

    # =========================================================
    # JOB SETUP (FIXED)
    # =========================================================
    def start_interval(self, minutes=1):

        self.scheduler.add_job(
            self.run_demo_ai,
            trigger="interval",
            minutes=minutes,
            id="demo_job",
            replace_existing=True,
            misfire_grace_time=300,
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

    # =========================================================
    # START / STOP (FIXED SAFE)
    # =========================================================
    def start(self):

        if not self.scheduler.running:
            self.scheduler.start()
            self.logger.info("🚀 Scheduler STARTED")

    def stop(self):

        if self.scheduler.running:
            self.scheduler.shutdown()
            self.logger.info("🛑 Scheduler STOPPED")