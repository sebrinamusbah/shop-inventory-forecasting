import os
import time
import logging
from dotenv import load_dotenv

from app.db import Database
from app.prophet_engine import ProphetEngine

from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine
from app.ai.engines.llm_engine import ExplanationEngine

from app.ai.core.pipeline import InventoryPipeline
from app.ai.scheduler import InventoryScheduler
from app.ai_repository import AIRepository


# =========================
# LOAD ENV
# =========================
load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
MODE = os.getenv("APP_MODE", "demo")


# =========================
# LOGGING
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

logger = logging.getLogger("MAIN")


def main():

    # =========================
    # VALIDATION
    # =========================
    if not DB_URL:
        raise ValueError("DATABASE_URL is missing")

    logger.info(" SYSTEM BOOTING...")

    # =========================
    # INIT CORE
    # =========================
    db = Database(DB_URL)
    repo = AIRepository(db)

    pipeline = InventoryPipeline(
        db=db,
        prophet=ProphetEngine(),
        decision=DecisionEngine(),
        risk=RiskEngine(),
        explainer=ExplanationEngine(use_llm=False),
        alerts=AlertEngine(),
        repo=repo
    )

    scheduler = InventoryScheduler(pipeline, db, repo)

    # =========================
    # START SCHEDULER
    # =========================
    scheduler.start()

    # =========================
    # REGISTER JOBS
    # =========================
    if MODE == "demo":
        logger.info("DEMO MODE ACTIVE (1-minute interval)")
        scheduler.start_interval(minutes=1)

    elif MODE == "production":
        logger.info("PRODUCTION MODE ACTIVE (daily snapshot)")
        scheduler.start_daily(run_hour=2)

    else:
        logger.warning("Invalid APP_MODE → defaulting to demo")
        scheduler.start_interval(minutes=1)

    logger.info(f"SYSTEM RUNNING IN {MODE.upper()} MODE")

    # =========================
    # KEEP ALIVE LOOP
    # =========================
    try:
        while True:
            time.sleep(5)

    except KeyboardInterrupt:
        logger.info(" Shutting down system...")
        scheduler.stop()


if __name__ == "__main__":
    main()