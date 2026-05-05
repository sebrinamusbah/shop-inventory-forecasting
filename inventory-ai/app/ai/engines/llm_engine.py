from typing import Dict


class ExplanationEngine:
    """
    SaaS-grade Explanation Layer (Time-aware + Business-ready)
    """

    def __init__(self, use_llm: bool = False):
        self.use_llm = use_llm

    # =============================
    # MAIN API
    # =============================
    def explain(self, forecast: Dict, decision: Dict) -> str:

        forecast = forecast or {}
        decision = decision or {}

        ctx = self._build_context(forecast, decision)

        if self.use_llm:
            return self._llm_explain(ctx)

        return self._rule_based_explain(ctx)

    # =============================
    # CONTEXT BUILDER
    # =============================
    def _build_context(self, forecast: Dict, decision: Dict) -> Dict:

        product = forecast.get("product") or {}
        metrics = forecast.get("metrics") or {}

        demand = float(metrics.get("predicted_demand") or 0)
        stock = float(product.get("current_stock") or 0)

        # safe daily demand
        daily_demand = demand / 30 if demand > 0 else 0.1

        # days until stock runs out
        days_left = stock / daily_demand if daily_demand > 0 else 999

        # monthly order suggestion
        monthly_order = max(0, int(daily_demand * 30 - stock))

        return {
            "product_id": product.get("id") or "UNKNOWN",
            "product_name": product.get("name") or product.get("product_name") or "Product",
            "demand": demand,
            "stock": stock,
            "daily_demand": daily_demand,
            "days_left": days_left,
            "monthly_order": monthly_order,
            "confidence": float(metrics.get("confidence_score") or 0),
            "action": decision.get("action", "NO_ACTION")
        }

    # =============================
    # RULE-BASED EXPLANATION (NEW LOGIC)
    # =============================
    def _rule_based_explain(self, ctx: Dict) -> str:

        name = ctx["product_name"]
        stock = ctx["stock"]
        days_left = ctx["days_left"]
        monthly_order = ctx["monthly_order"]
        confidence = ctx["confidence"]
        action = ctx["action"]

        # -----------------------------
        # 1. EMERGENCY (VERY LOW STOCK TIME)
        # -----------------------------
        if days_left <= 2:
            return (
                f"{name} is understocked and will run out in {int(days_left)} days. "
                f"Immediate purchase of {monthly_order} units is required for 1 month supply."
            )

        # -----------------------------
        # 2. LOW STOCK WARNING
        # -----------------------------
        if days_left <= 7:
            return (
                f"{name} stock is low. Estimated to last {int(days_left)} days. "
                f"Recommended order: {monthly_order} units for monthly coverage."
            )

        # -----------------------------
        # 3. RESTOCK SIGNAL
        # -----------------------------
        if action == "RESTOCK":
            return (
                f"{name} demand is increasing. "
                f"Suggested order: {monthly_order} units for next month."
            )

        # -----------------------------
        # 4. OVERSTOCK
        # -----------------------------
        if stock > ctx["demand"]:
            return (
                f"{name} is overstocked. Consider reducing purchases or running promotions."
            )

        # -----------------------------
        # 5. LOW CONFIDENCE
        # -----------------------------
        if confidence < 0.5:
            return (
                f"Forecast for {name} is uncertain (confidence {confidence:.2f}). "
                f"Use caution before ordering {monthly_order} units."
            )

        # -----------------------------
        # DEFAULT
        # -----------------------------
        return f"{name} is stable. No immediate action required."

    # =============================
    # LLM MODE (OPTIONAL)
    # =============================
    def _llm_explain(self, ctx: Dict) -> str:
        return (
            f"[LLM MODE]\n"
            f"{ctx}"
        )