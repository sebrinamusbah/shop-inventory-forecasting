class AlertEngine:
    """
    Production Alert Generator (Fully Fixed & Stable)
    """

    def generate_alerts(self, forecast, decision, risk):

        alerts = []
        seen = set()

        # =============================
        # 1. SAFE INPUT VALIDATION
        # =============================
        if not isinstance(forecast, dict):
            forecast = {}

        if not isinstance(decision, dict):
            decision = {}

        if not isinstance(risk, dict):
            risk = {}

        # =============================
        # 2. SAFE EXTRACTION
        # =============================
        product = forecast.get("product") or {}

        product_id = product.get("id") or forecast.get("product_id")
        product_name = (
            product.get("name")
            or product.get("product_name")
            or "UNKNOWN"
        )

        if product_id is None:
            return []

        metrics = forecast.get("metrics") or {}

        # -----------------------------
        # SAFE STOCK
        # -----------------------------
        stock = product.get("current_stock")
        if stock is None:
            stock = product.get("current_quantity", 0)

        try:
            stock = float(stock)
        except (TypeError, ValueError):
            stock = 0

        # -----------------------------
        # SAFE CONFIDENCE
        # -----------------------------
        try:
            confidence = float(metrics.get("confidence_score") or 0)
        except (TypeError, ValueError):
            confidence = 0

        # -----------------------------
        # SAFE RISK
        # -----------------------------
        try:
            risk_score = float(risk.get("risk_score") or 0)
        except (TypeError, ValueError):
            risk_score = 0

        action = decision.get("action")

        # =============================
        # 3. CRITICAL RISK ALERT
        # =============================
        if risk_score >= 0.7:
            key = (product_id, "CRITICAL_RISK")
            if key not in seen:
                alerts.append({
                    "type": "CRITICAL_RISK",
                    "priority": "HIGH",
                    "product_id": product_id,
                    "product_name": product_name,
                    "message": f"{product_name} is in CRITICAL risk zone."
                })
                seen.add(key)

        # =============================
        # 4. OUT OF STOCK ALERT
        # =============================
        if stock <= 0:
            key = (product_id, "OUT_OF_STOCK")
            if key not in seen:
                alerts.append({
                    "type": "OUT_OF_STOCK",
                    "priority": "HIGH",
                    "product_id": product_id,
                    "product_name": product_name,
                    "message": f"{product_name} is OUT OF STOCK."
                })
                seen.add(key)

        # =============================
        # 5. RESTOCK ALERT
        # =============================
        if action in ["RESTOCK", "EMERGENCY_RESTOCK"]:
            key = (product_id, "RESTOCK")
            if key not in seen:
                alerts.append({
                    "type": "RESTOCK_REQUIRED",
                    "priority": "MEDIUM",
                    "product_id": product_id,
                    "product_name": product_name,
                    "message": f"{product_name} requires restocking ({action})."
                })
                seen.add(key)

        # =============================
        # 6. LOW CONFIDENCE ALERT
        # =============================
        if confidence < 0.25:
            key = (product_id, "LOW_CONFIDENCE")
            if key not in seen:
                alerts.append({
                    "type": "LOW_CONFIDENCE",
                    "priority": "LOW",
                    "product_id": product_id,
                    "product_name": product_name,
                    "message": f"{product_name} forecast is uncertain (confidence {confidence:.2f})."
                })
                seen.add(key)

        return alerts