from typing import Dict


class ExplanationEngine:
    """
    Phase 3: SaaS-grade Explanation Layer

    Converts:
        Forecast + Decision → Human business explanation

    Design:
        - deterministic fallback (safe)
        - LLM-ready architecture (future upgrade)
        - structured reasoning model
    """

    def __init__(self, use_llm: bool = False):
        self.use_llm = use_llm

    # -----------------------------
    # MAIN API
    # -----------------------------
    def explain(self, forecast: Dict, decision: Dict) -> str:
        """
        Generate human-readable business explanation
        """

        context = self._build_context(forecast, decision)

        # =============================
        # LLM MODE (future upgrade)
        # =============================
        if self.use_llm:
            return self._llm_explain(context)

        # =============================
        # RULE-BASED FALLBACK (NOW)
        # =============================
        return self._rule_based_explain(context)

    # -----------------------------
    # CONTEXT BUILDER (IMPORTANT)
    # -----------------------------
    def _build_context(self, forecast: Dict, decision: Dict) -> Dict:
        product = forecast.get("product") or {}
        return {
            "product_id": forecast.get("product_id") or product.get("id"),
            "demand": forecast.get("predicted_demand", 0) or forecast.get("metrics", {}).get("predicted_demand", 0),
            "stock": forecast.get("current_stock", 0) or product.get("current_stock", 0),
            "confidence": float(forecast.get("confidence_score", 0) or forecast.get("metrics", {}).get("confidence_score", 0)),
            "action": decision.get("action"),
            "recommended_order": decision.get("recommended_order", 0),
            "reason": decision.get("reason", "Model-based decision")
        }

    # -----------------------------
    # RULE-BASED ENGINE (NOW)
    # -----------------------------
    def _rule_based_explain(self, ctx: Dict) -> str:

        product_id = ctx["product_id"]
        demand = ctx["demand"]
        stock = ctx["stock"]
        confidence = ctx["confidence"]
        action = ctx["action"]

        # =============================
        # LOW CONFIDENCE CASE
        # =============================
        if confidence < 0.5:
            return (
                f"Forecast for Product {product_id} has low confidence ({confidence:.2f}). "
                f"Decision '{action}' is conservative due to insufficient data reliability. "
                f"Business impact is minimized by avoiding aggressive inventory changes."
            )

        # =============================
        # EMERGENCY RESTOCK
        # =============================
        if action == "EMERGENCY_RESTOCK":
            return (
                f"CRITICAL ALERT: Product {product_id} demand ({demand}) far exceeds stock ({stock}). "
                f"The system recommends immediate emergency restocking to prevent stockout risk. "
                f"Confidence level: {confidence:.2f}. Business priority: HIGH."
            )

        # =============================
        # RESTOCK
        # =============================
        if action == "RESTOCK":
            return (
                f"Inventory recommendation for Product {product_id}: RESTOCK. "
                f"Forecasted demand is {demand} units vs {stock} available units. "
                f"Confidence is {confidence:.2f}, indicating stable predictive signal. "
                f"This action reduces stockout risk while maintaining healthy inventory flow."
            )

        # =============================
        # OVERSTOCK / REDUCE
        # =============================
        if action in ["OVERSTOCK", "REDUCE_STOCK"]:
            return (
                f"Product {product_id} shows overstock conditions. "
                f"Current stock ({stock}) exceeds forecasted demand ({demand}). "
                f"Recommendation: slow procurement or trigger promotional strategy. "
                f"Confidence: {confidence:.2f}."
            )

        # =============================
        # HOLD (DEFAULT)
        # =============================
        return (
            f"Product {product_id} is stable. "
            f"No immediate action required as stock ({stock}) aligns with demand forecast ({demand}). "
            f"System recommends monitoring trend before next decision cycle."
        )

    # -----------------------------
    # LLM HOOK (PHASE 4 READY)
    # -----------------------------
    def _llm_explain(self, context: Dict) -> str:
        """
        Placeholder for Phase 4 (LLM like TinyLlama/OpenAI)

        You will later plug:
            - TinyLlama
            - Mistral
            - OpenAI GPT
        """
        return (
            f"[LLM MODE ENABLED]\n"
            f"Product {context['product_id']} requires decision explanation.\n"
            f"Context: {context}\n"
            f"(Replace with real LLM call in Phase 4)"
        )
        