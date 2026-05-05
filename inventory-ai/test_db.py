from app.db import Database
from app.prophet_engine import ProphetEngine
from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine
from app.ai.engines.llm_engine import ExplanationEngine
from app.ai.core.pipeline import InventoryPipeline
from app.ai_repository import AIRepository
import os
from dotenv import load_dotenv

load_dotenv()

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

print("📦 Products:", db.get_all_product_ids()[:5])

pid = db.get_all_product_ids()[0]

result = pipeline.run(pid)

print("\n===================")
print("AI SYSTEM RESULT")
print("===================")
print(result)