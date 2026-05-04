class DecisionEngine:
    """
    Production-grade Inventory Decision Engine (WITH PURCHASE PLANNING)
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

        product = forecast.get("product", {}) or {}
        metrics = forecast.get("metrics", {}) or {}

        product_id = product.get("id")
        stock = float(product.get("current_stock", 0))

        total_demand = float(metrics.get("predicted_demand", 0))
        confidence = float(metrics.get("confidence_score", 0))

        # -----------------------------
        # NORMALIZATION
        # -----------------------------
        confidence = max(0.0, min(confidence, 1.0))

        # Convert 30-day forecast → daily demand
        daily_demand = total_demand / 30.0 if total_demand > 0 else 0.1

        # 7-day planning demand
        short_term_demand = daily_demand * self.reorder_days

        # Safety stock
        safety_stock = max(self.safety_stock, daily_demand * 2)

        # -----------------------------
        # LOW CONFIDENCE
        # -----------------------------
        if confidence < self.min_confidence:
            return {
                "product_id": product_id,
                "action": "NO_ACTION",
                "reason": "Low confidence forecast",
                "stock": stock,
                "confidence": confidence
            }

        # -----------------------------
        # DAYS OF STOCK
        # -----------------------------
        safe_demand = max(daily_demand, 0.1)
        days_of_stock = stock / safe_demand

        # -----------------------------
        # 🛑 EMERGENCY RULE
        # -----------------------------
        if days_of_stock <= self.emergency_days:
            purchase_qty = max(
                0,
                int(short_term_demand + safety_stock - stock)
            )

            return {
                "product_id": product_id,
                "action": "EMERGENCY_RESTOCK",
                "stock": stock,
                "daily_demand": daily_demand,
                "days_of_stock": round(days_of_stock, 2),

                # ⭐ MAIN OUTPUT (IMPORTANT)
                "recommended_order": purchase_qty,

                "reason": "Stock will run out soon",
                "confidence": confidence
            }

        # -----------------------------
        # NORMAL PLANNING LOGIC
        # -----------------------------
        target_stock = (short_term_demand * self.safety_factor) + safety_stock

        purchase_qty = max(0, int(target_stock - stock))

        if purchase_qty > 0:
            action = "RESTOCK"
        else:
            action = "HOLD"

        return {
            "product_id": product_id,
            "action": action,
            "stock": stock,
            "daily_demand": daily_demand,
            "target_stock": target_stock,

            # ⭐ MAIN OUTPUT
            "recommended_order": purchase_qty,

            "confidence": confidence,
            "reason": "Forecast-based inventory planning"
        }