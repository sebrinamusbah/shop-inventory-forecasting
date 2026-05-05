class AlertEngine:

    def generate_alerts(self, forecast, decision, risk):

        alerts = []

        forecast = forecast or {}
        decision = decision or {}
        risk = risk or {}

        product = forecast.get("product") or {}
        metrics = forecast.get("metrics") or {}

        product_id = product.get("id") or forecast.get("product_id")

        product_name = (
            product.get("name")
            or product.get("product_name")
            or "UNKNOWN"
        )

        if product_id is None:
            return []

        # 🔴 FIX 1: duplicate bug removed
        stock = float(product.get("current_quantity") or 0)

        confidence = float(metrics.get("confidence_score") or 0)
        confidence = max(0.0, min(confidence, 1.0))

        risk_score = float(risk.get("risk_score") or 0)
        action = decision.get("action")

        # =============================
        # OUT OF STOCK
        # =============================
        if stock <= 0:
            alerts.append({
                "product_id": product_id,
                "product_name": product_name,
                "alert_type": "OUT_OF_STOCK",
                "priority": "HIGH",
                "alert_message": f"{product_name} is OUT OF STOCK"
            })

        # =============================
        # LOW STOCK (FIXED: demand-aware instead of hardcoded 10)
        # =============================
        total_demand = float(metrics.get("predicted_demand") or 0)
        low_stock_threshold = total_demand * 0.2 if total_demand > 0 else 10

        if stock > 0 and stock < low_stock_threshold:
            alerts.append({
                "product_id": product_id,
                "product_name": product_name,
                "alert_type": "LOW_STOCK",
                "priority": "MEDIUM",
                "alert_message": f"{product_name} is running low (stock={stock})"
            })

        # =============================
        # CRITICAL RISK
        # =============================
        if risk_score >= 0.75 and confidence > 0.3:
            alerts.append({
                "product_id": product_id,
                "product_name": product_name,
                "alert_type": "CRITICAL_RISK",
                "priority": "HIGH",
                "alert_message": f"{product_name} is in CRITICAL risk zone"
            })

        # =============================
        # RESTOCK
        # =============================
        if action in ["RESTOCK", "EMERGENCY_RESTOCK"]:
            alerts.append({
                "product_id": product_id,
                "product_name": product_name,
                "alert_type": "RESTOCK_ALERT",
                "priority": "MEDIUM",
                "alert_message": f"{product_name} requires restocking ({action})"
            })

        # =============================
        # OVERSTOCK (optional improvement aligned with ExplanationEngine)
        # =============================
        safety_buffer = total_demand * 0.2

        if confidence > 0.6 and stock > (total_demand + safety_buffer):
            alerts.append({
                "product_id": product_id,
                "product_name": product_name,
                "alert_type": "OVERSTOCK",
                "priority": "LOW",
                "alert_message": (
                    f"{product_name} is overstocked. "
                    f"Consider discounts or promotions."
                )
            })

        # =============================
        # LOW CONFIDENCE (FIXED MESSAGE STYLE)
        # =============================
        if confidence < 0.3:
            alerts.append({
                "product_id": product_id,
                "product_name": product_name,
                "alert_type": "LOW_CONFIDENCE",
                "priority": "LOW",
                "alert_message": (
                    f"Forecast for {product_name} is uncertain. "
                    f"Treat predictions with caution."
                )
            })

        return alerts