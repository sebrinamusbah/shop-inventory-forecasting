from typing import Dict


class ExplanationEngine:

    def __init__(self, use_llm: bool = False):
        self.use_llm = use_llm

    def explain(self, forecast: Dict, decision: Dict) -> Dict:

        forecast = forecast or {}
        decision = decision or {}

        ctx = self._build_context(forecast, decision)

        if self.use_llm:
            return self._llm_explain(ctx)

        return self._rule_based_explain(ctx)

    # =============================
    # CONTEXT
    # =============================
    def _build_context(self, forecast: Dict, decision: Dict) -> Dict:

        product = forecast.get("product") or {}
        metrics = forecast.get("metrics") or {}

        # 🔴 FIX 2: clear demand definition
        total_demand = float(metrics.get("predicted_demand") or 0)

        # 🔴 FIX 1: single stock source (no duplicates)
        stock = float(product.get("current_quantity") or 0)

        periods = forecast.get("model_meta", {}).get("periods", 30)

        daily_demand = total_demand / max(periods, 1)
        daily_demand = max(daily_demand, 0.0001)

        days_left = stock / daily_demand if daily_demand > 0 else float("inf")

        monthly_order = max(0, int(daily_demand * 30 - stock))

        return {
            "product_id": product.get("id") or "UNKNOWN",
            "product_name": product.get("name") or "Product",
            "stock": stock,
            "total_demand": total_demand,
            "daily_demand": daily_demand,
            "days_left": days_left,
            "monthly_order": monthly_order,
            "confidence": float(metrics.get("confidence_score") or 0),
            "action": decision.get("action", "NO_ACTION")
        }

    # =============================
    # RULE ENGINE
    # =============================
    def _rule_based_explain(self, ctx: Dict) -> Dict:

        name = ctx["product_name"]
        stock = ctx["stock"]
        demand = ctx["total_demand"]
        days_left = ctx["days_left"]
        monthly_order = ctx["monthly_order"]
        confidence = ctx["confidence"]
        action = ctx["action"]

        # =============================
        # CRITICAL SHORTAGE
        # =============================
        if days_left <= 2:
            return {
                "product_id": ctx["product_id"],
                "product_name": name,
                "message": f"{name} will run out in {int(days_left)} days. Immediate restocking required.",
                "insight_type": "critical",
                "severity": "high",
                "reason_summary": "Severe stock shortage"
            }

        # =============================
        # LOW STOCK
        # =============================
        if days_left <= 7:
            return {
                "product_id": ctx["product_id"],
                "product_name": name,
                "message": f"{name} stock is low. Will last ~{int(days_left)} days.",
                "insight_type": "warning",
                "severity": "medium",
                "reason_summary": "Demand exceeding supply"
            }

        # =============================
        # RESTOCK ACTION
        # =============================
        if action in ["RESTOCK", "EMERGENCY_RESTOCK"]:
            return {
                "product_id": ctx["product_id"],
                "product_name": name,
                "message": f"Suggested order: {monthly_order} units for {name}.",
                "insight_type": "info",
                "severity": "medium",
                "reason_summary": "Demand increase detected"
            }

        # =============================
        # 🔴 FIX 4: IMPROVED OVERSTOCK LOGIC
        # =============================
        safety_buffer = demand * 0.2

        if confidence > 0.5 and stock > (demand + safety_buffer):
            return {
                "product_id": ctx["product_id"],
                "product_name": name,
                "message": (
                    f"{name} is overstocked. "
                    f"Consider discounts or promotions to reduce inventory."
                ),
                "insight_type": "warning",
                "severity": "low",
                "reason_summary": "Excess inventory vs demand"
            }

        # =============================
        # 🔴 FIX 3 + 5: BETTER LOW CONFIDENCE MESSAGE
        # =============================
        if confidence is not None and confidence < 0.2:
            return {
                "product_id": ctx["product_id"],
                "product_name": name,
                "message": (
                    f"Forecast for {name} is uncertain. "
                    f"Treat this prediction with caution."
                ),
                "insight_type": "uncertain",
                "severity": "low",
                "reason_summary": "Model uncertainty"
            }

        # =============================
        # STABLE CASE
        # =============================
        return {
            "product_id": ctx["product_id"],
            "product_name": name,
            "message": f"{name} is stable. No action required.",
            "insight_type": "stable",
            "severity": "low",
            "reason_summary": "Balanced supply and demand"
        }

    # =============================
    # LLM MODE
    # =============================
    def _llm_explain(self, ctx: Dict) -> Dict:
        return {
            "product_id": ctx["product_id"],
            "product_name": ctx["product_name"],
            "message": f"[LLM] Insight for {ctx['product_name']}",
            "insight_type": "llm",
            "severity": "medium",
            "reason_summary": "LLM explanation"
        }