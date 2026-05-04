from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import logging

from app.ai_repository import AIRepository


class InventoryScheduler:

    def __init__(self, pipeline, db):
        self.pipeline = pipeline
        self.db = db

        # ONLY scheduler saves
        self.repo = AIRepository(db)

        self.scheduler = BackgroundScheduler()
        self.logger = logging.getLogger("InventoryScheduler")

    # =========================
    # DEMO MODE (every X min)
    # =========================
    def run_demo_ai(self):

        try:
            self.logger.info(f"⚡ DEMO RUN: {datetime.now()}")

            product_ids = self.db.get_all_product_ids()

            for pid in product_ids:

                # 1. RUN AI ONLY
                context = self.pipeline.run(pid)

                # 2. SAVE RESULTS HERE (ONLY PLACE)
                self.repo.save_prediction(context)
                self.repo.save_insight(context)

                action = getattr(context.decision, "action", None)
                self.logger.info(f"[DEMO] Product {pid} → {action}")

        except Exception as e:
            self.logger.error(f"Demo error: {e}")

    # =========================
    # PRODUCTION DAILY SNAPSHOT
    # =========================
    def run_daily_snapshot(self):

        try:
            self.logger.info(f"📊 DAILY SNAPSHOT: {datetime.now()}")

            product_ids = self.db.get_all_product_ids()

            total_sales = 0
            total_profit = 0
            low_stock_count = 0
            product_scores = []

            for pid in product_ids:

                # 1. RUN AI ONLY
                context = self.pipeline.run(pid)

                forecast = context.forecast or {}

                metrics = forecast.get("metrics", {})
                demand = metrics.get("predicted_demand", 0)

                action = getattr(context.decision, "action", None)

                total_sales += demand
                total_profit += demand * 0.25

                if action == "RESTOCK":
                    low_stock_count += 1

                product_scores.append((pid, demand))

                # 2. SAVE per-product AI results
                self.repo.save_prediction(context)
                self.repo.save_insight(context)

            # 3. SNAPSHOT CALCULATION
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
                "sales_trend": sales_trend
            }

            # 4. SAVE SNAPSHOT (ONLY HERE)
            self.repo.save_snapshot(snapshot)

            self.logger.info("✅ Daily snapshot saved")

        except Exception as e:
            self.logger.error(f"Snapshot error: {e}")

    # =========================
    # START DEMO MODE
    # =========================
    def start_interval(self, minutes=10):

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
    # START PRODUCTION MODE
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