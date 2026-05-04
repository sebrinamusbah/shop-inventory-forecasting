class RiskEngine:
    """
    Production-grade Risk Engine (stable + bounded + non-explosive)
    """

    def evaluate(self, forecast: dict):

        # -----------------------------
        # SAFE EXTRACTION
        # -----------------------------
        product = forecast.get("product", {}) or {}
        metrics = forecast.get("metrics", {}) or {}

        product_id = product.get("id", "UNKNOWN")

        demand = float(metrics.get("predicted_demand", 0))
        stock = float(product.get("current_stock", 0))
        confidence = float(metrics.get("confidence_score", 0))

        # -----------------------------
        # NORMALIZATION
        # -----------------------------
        confidence = max(0.0, min(confidence, 1.0))
        demand = max(demand, 0.0)
        stock = max(stock, 0.0)

        denom = demand + stock + 1e-9  # ✅ IMPORTANT FIX (your requested formula base)

        # -----------------------------
        # RISK COMPONENTS (FIXED FORMULA)
        # -----------------------------
        stockout_risk = (demand - stock) / denom
        stockout_risk = min(1.0, max(0.0, stockout_risk))

        overstock_risk = (stock - demand) / denom
        overstock_risk = min(1.0, max(0.0, overstock_risk))

        confidence_risk = 1.0 - confidence

        # -----------------------------
        # FINAL SCORE
        # -----------------------------
        risk_score = (
            0.5 * stockout_risk +
            0.3 * overstock_risk +
            0.2 * confidence_risk
        )

        risk_score = min(1.0, max(0.0, risk_score))

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
        # OUTPUT
        # -----------------------------
        return {
    "product_id": product_id,
    "product": product,

    "risk_score": round(risk_score, 3),
    "risk_level": risk_level,

    "stockout_risk": round(stockout_risk, 3),
    "overstock_risk": round(overstock_risk, 3),
    "confidence_risk": round(confidence_risk, 3)
}