class RiskEngine:
    """
    Production-grade Risk Engine (Stable + Smoothed + Safe)
    """

    def evaluate(self, forecast: dict):

        forecast = forecast or {}

        # -----------------------------
        # SAFE EXTRACTION
        # -----------------------------
        product = forecast.get("product") or {}
        metrics = forecast.get("metrics") or {}

        product_id = product.get("id") or "UNKNOWN"

        demand = float(metrics.get("predicted_demand") or 0)
        stock = float(product.get("current_stock") or 0)
        confidence = float(metrics.get("confidence_score") or 0)

        # -----------------------------
        # NORMALIZATION
        # -----------------------------
        confidence = max(0.0, min(confidence, 1.0))
        demand = max(0.0, demand)
        stock = max(0.0, stock)

        # -----------------------------
        # SAFE DENOMINATOR (SMOOTHED)
        # -----------------------------
        denom = max(demand + stock, 1.0)

        # -----------------------------
        # RISK COMPONENTS (STABLE FORMULA)
        # -----------------------------

        # stockout pressure (more stable than raw diff)
        stockout_risk = demand / denom if stock < demand else 0.0

        # overstock pressure
        overstock_risk = stock / denom if stock > demand else 0.0

        # confidence risk
        confidence_risk = 1.0 - confidence

        # -----------------------------
        # FINAL RISK SCORE
        # -----------------------------
        risk_score = (
            0.5 * stockout_risk +
            0.3 * overstock_risk +
            0.2 * confidence_risk
        )

        risk_score = max(0.0, min(risk_score, 1.0))

        # -----------------------------
        # RISK LEVEL
        # -----------------------------
        if risk_score >= 0.75:
            risk_level = "CRITICAL"
        elif risk_score >= 0.5:
            risk_level = "HIGH"
        elif risk_score >= 0.25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # -----------------------------
        # OUTPUT (CLEAN + PIPELINE SAFE)
        # -----------------------------
        return {
            "product_id": product_id,

            # cleaned product (avoid DB pollution)
            "product": {
                "id": product.get("id"),
                "name": product.get("name") or product.get("product_name"),
                "current_stock": stock
            },

            "risk_score": round(risk_score, 3),
            "risk_level": risk_level,

            "stockout_risk": round(stockout_risk, 3),
            "overstock_risk": round(overstock_risk, 3),
            "confidence_risk": round(confidence_risk, 3)
        }