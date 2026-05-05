import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

from app.db import Database
from app.prophet_engine import ProphetEngine
from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine
from app.ai.engines.llm_engine import ExplanationEngine
from app.ai.core.pipeline import InventoryPipeline
from app.ai_repository import AIRepository

db = Database(os.getenv("DATABASE_URL"))
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

print("Product IDs:", db.get_all_product_ids()[:10])

product_id = 1
context = pipeline.run(product_id)

print("prediction_result:", context.prediction_result)
print("insight_result:", context.insight_result)
print("alerts_result:", context.alerts_result)
print("forecast:", context.forecast)
