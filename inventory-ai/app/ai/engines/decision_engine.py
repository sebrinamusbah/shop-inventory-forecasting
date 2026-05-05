class DecisionEngine:
    """
    Production-grade Inventory Decision Engine (Fixed & Stable)
    """

    def __init__(
        self,
        safety_factor: float = 1.3,
        min_confidence: float = 0.5,
        reorder_days: int = 7,
        emergency_days: int = 2,
        safety_stock: int = 10
    ):
        self.safety_factor = safety_factor
        self.min_confidence = min_confidence
        self.reorder_days = reorder_days
        self.emergency_days = emergency_days
        self.safety_stock = safety_stock

    def evaluate(self, forecast: dict):

        forecast = forecast or {}

        product = forecast.get("product") or {}
        metrics = forecast.get("metrics") or {}

        product_id = product.get("id")

        stock = float(product.get("current_stock") or 0)

        total_demand = float(metrics.get("predicted_demand") or 0)
        confidence = float(metrics.get("confidence_score") or 0)

        # -----------------------------
        # NORMALIZATION
        # -----------------------------
        confidence = max(0.0, min(confidence, 1.0))

        # safer demand handling (NO FAKE 0.1)
        if total_demand <= 0:
            return {
                "product_id": product_id,
                "action": "NO_ACTION",
                "recommended_order": 0,
                "reason": "No demand predicted",
                "stock": stock,
                "confidence": confidence
            }

        periods = forecast.get("model_meta", {}).get("periods", 30)
        daily_demand = total_demand / max(periods, 1)

        short_term_demand = daily_demand * self.reorder_days

        # dynamic safety stock
        safety_stock = max(self.safety_stock, daily_demand * 2)

        # -----------------------------
        # LOW CONFIDENCE SAFETY MODE
        # -----------------------------
        if confidence < self.min_confidence:
            return {
                "product_id": product_id,
                "action": "NO_ACTION",
                "recommended_order": 0,
                "reason": "Low confidence forecast",
                "stock": stock,
                "confidence": confidence
            }

        # -----------------------------
        # DAYS OF STOCK (SAFE)
        # -----------------------------
        safe_demand = max(daily_demand, 0.1)
        days_of_stock = stock / safe_demand

        # -----------------------------
        # EMERGENCY RESTOCK
        # -----------------------------
        
        if days_of_stock <= self.emergency_days:

            recommended_order = int(
                short_term_demand + safety_stock - stock
            )
            

            recommended_order = max(0, min(recommended_order, 10000))

            return {
                "product_id": product_id,
                "action": "EMERGENCY_RESTOCK",
                "stock": stock,
                "daily_demand": daily_demand,
                "days_of_stock": round(days_of_stock, 2),
                "recommended_order": recommended_order,
                "confidence": confidence,
                "reason": "Stock will run out soon"
            }

        # -----------------------------
        # NORMAL RESTOCK LOGIC
        # -----------------------------
        target_stock = (short_term_demand * self.safety_factor) + safety_stock

        recommended_order = int(target_stock - stock)

        # prevent negative or extreme orders
        recommended_order = max(0, min(recommended_order, 10000))

        action = "RESTOCK" if recommended_order > 0 else "HOLD"

        return {
    "product_id": product_id,
    "action": action,
    "stock": stock,
    "daily_demand": daily_demand,
    "days_of_stock": round(days_of_stock, 2), 
    "target_stock": target_stock,
    "recommended_order": recommended_order,
    "confidence": confidence,
    "reason": "Forecast-based inventory planning"
}