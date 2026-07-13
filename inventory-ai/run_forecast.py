import os
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

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    raise ValueError("DATABASE_URL is missing")

db = Database(DB_URL)
repo = AIRepository(db)

pipeline = InventoryPipeline(
    db=db,
    prophet=ProphetEngine(),
    decision=DecisionEngine(),
    risk=RiskEngine(),
    explainer=ExplanationEngine(use_llm=False),
    alerts=AlertEngine(),
    repo=repo,
)

scheduler = InventoryScheduler(pipeline, db, repo)

scheduler.run_once()