from dotenv import load_dotenv
import os
import time

from app.db import Database
from app.prophet_engine import ProphetEngine

from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine
from app.ai.engines.llm_engine import ExplanationEngine

from app.ai.core.pipeline import InventoryPipeline
from app.ai.scheduler import InventoryScheduler


# =============================
# LOAD ENV
# =============================
load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
MODE = os.getenv("APP_MODE", "demo")  # demo or production


def main():

    db = Database(DB_URL)

    pipeline = InventoryPipeline(
        db=db,
        prophet=ProphetEngine(),
        decision=DecisionEngine(),
        risk=RiskEngine(),
        explainer=ExplanationEngine(use_llm=False),
        alerts=AlertEngine()
    )

    scheduler = InventoryScheduler(pipeline, db)

    # =============================
    # MODE SWITCH
    # =============================
    if MODE == "demo":
        scheduler.start_interval(minutes=5)
        print("🚀 DEMO MODE → every 5 minutes")

    else:
        scheduler.start_daily(run_hour=2)
        print("🏭 PRODUCTION MODE → daily at 02:00")

    try:
        while True:
            time.sleep(5)

    except KeyboardInterrupt:
        scheduler.stop()
        print("🛑 Scheduler stopped")


if __name__ == "__main__":
    main()