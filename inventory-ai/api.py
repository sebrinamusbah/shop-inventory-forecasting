from fastapi import FastAPI, HTTPException
import os
from dotenv import load_dotenv

from app.db import Database
from app.prophet_engine import ProphetEngine

from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine
from app.ai.engines.llm_engine import ExplanationEngine

from app.ai.core.pipeline import InventoryPipeline
from app.ai_repository import AIRepository

load_dotenv()

app = FastAPI(title="Inventory AI System")


# =============================
# INIT
# =============================
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
    repo=repo
)


# =============================
# HEALTH
# =============================
@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "AI system is running"
    }


# =============================
# RUN AI FOR SINGLE PRODUCT
# =============================
@app.post("/run-ai/{product_id}")
def run_ai(product_id: int):

    try:

        context = pipeline.run(product_id)

        if not context:
            raise ValueError("Pipeline returned no context")

        return {
            "status": "success",

            "product_id": product_id,

            "prediction": getattr(context, "prediction_result", None),

            "insight": getattr(context, "insight_result", None),

            "alerts": getattr(context, "alerts_result", []),

            "decision": getattr(context, "decision", {}),

            "risk": getattr(context, "risk", {}),

            "forecast": getattr(context, "forecast", {}),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI execution failed: {str(e)}"
        )


# =============================
# RUN AI FOR ALL PRODUCTS
# =============================
@app.post("/run-ai-all")
def run_ai_all():
    products = db.fetch_all("SELECT id FROM products")

    results = []

    for p in products:
        result = pipeline.run(p["id"])
        results.append({
            "product_id": p["id"],
            "result": result
        })

    return {
        "success": True,
        "count": len(results),
        "results": results
    }