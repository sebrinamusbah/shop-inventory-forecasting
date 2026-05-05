import numpy as np


class DecisionEngine:

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
        meta = forecast.get("model_meta") or {}

        product_id = product.get("id")
        stock = float(product.get("current_quantity") or 0)

        total_demand = float(metrics.get("predicted_demand") or 0)
        confidence = float(metrics.get("confidence_score") or 0)

        confidence = max(0.0, min(confidence, 1.0))
        total_demand = max(total_demand, 0.0)

        periods = meta.get("periods", 30)

        daily_demand = float(
            metrics.get("avg_daily_demand")
            or (total_demand / max(periods, 1))
        )

        short_term_demand = daily_demand * self.reorder_days
        safety_stock = max(self.safety_stock, daily_demand * 2)

        # LOW CONFIDENCE
        if confidence < self.min_confidence:
            return {
                "product_id": product_id,
                "action": "NO_ACTION",
                "recommended_order": 0,
                "stock": stock,
                "confidence": confidence,
                "reason": "Low confidence forecast"
            }

        if daily_demand <= 0:
            days_of_stock = float("inf")
        else:
            days_of_stock = stock / daily_demand

        if days_of_stock <= self.emergency_days:
            stock_status = "CRITICAL"
        elif days_of_stock <= self.reorder_days:
            stock_status = "UNDERSTOCKED"
        else:
            stock_status = "OK"

        risk_score = 1 - np.exp(-short_term_demand / (stock + 1e-6))
        risk_score = float(np.clip(risk_score, 0.0, 1.0))

        # ACTION MAP
        action_map = {
            "CRITICAL": "EMERGENCY_RESTOCK",
            "UNDERSTOCKED": "RESTOCK",
            "OK": "NO_ACTION"
        }

        action = action_map[stock_status]

        if stock_status == "CRITICAL":

            recommended_order = int(
                short_term_demand + safety_stock - stock
            )

            return {
                "product_id": product_id,
                "action": "EMERGENCY_RESTOCK",
                "stock": stock,
                "daily_demand": daily_demand,
                "days_of_stock": round(days_of_stock, 2),
                "recommended_order": max(0, recommended_order),
                "confidence": confidence,
                "risk_score": risk_score,
                "reason": f"Will run out in {round(days_of_stock, 1)} days"
            }

        target_stock = (short_term_demand * self.safety_factor) + safety_stock

        recommended_order = int(target_stock - stock)

        return {
            "product_id": product_id,
            "action": action,
            "stock": stock,
            "daily_demand": daily_demand,
            "days_of_stock": round(days_of_stock, 2),
            "target_stock": target_stock,
            "recommended_order": max(0, recommended_order),
            "confidence": confidence,
            "risk_score": risk_score,
            "reason": "Forecast-based inventory planning"
        }