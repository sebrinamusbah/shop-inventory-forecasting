from fastapi import FastAPI, HTTPException
from app.db import Database
from app.prophet_engine import ProphetEngine
from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine
from app.ai.engines.llm_engine import ExplanationEngine
from app.ai.core.inventory_pipeline import InventoryPipeline
from app.ai_repository import AIRepository

import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

db = Database(os.getenv("DATABASE_URL"))

pipeline = InventoryPipeline(
    db=db,
    prophet=ProphetEngine(),
    decision=DecisionEngine(),
    risk=RiskEngine(),
    explainer=ExplanationEngine(use_llm=False),
    alerts=AlertEngine()
)

repo = AIRepository(db)


@app.post("/run-ai/{product_id}")
def run_ai(product_id: int):

    try:
        # =====================
        # 1. RUN AI PIPELINE
        # =====================
        context = pipeline.run(product_id)

        # =====================
        # 2. SAVE RESULTS
        # =====================
        repo.save_prediction(context.prediction_result)
        repo.save_insight(context.insight_result)

        if hasattr(context, "alerts_result") and context.alerts_result:
            repo.save_alerts(context.alerts_result)

        # =====================
        # RESPONSE
        # =====================
        return {
            "status": "success",
            "product_id": product_id,
            "action": context.decision.get("action") if isinstance(context.decision, dict) else None,
            "risk_score": context.risk.get("risk_score") if isinstance(context.risk, dict) else None,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI execution failed: {str(e)}"
        )