def to_api_response(context):
    forecast = context.forecast or {}
    metrics = forecast.get("metrics", {}) or {}

    return {
        "product_id": context.product_id,

        # =========================
        # DECISION
        # =========================
        "action": (context.decision.get("action") if isinstance(context.decision, dict) else None),
        "recommended_order": (context.decision.get("recommended_order") if isinstance(context.decision, dict) else None),

        # =========================
        # RISK
        # =========================
        "risk_level": (context.risk.get("risk_level") if isinstance(context.risk, dict) else None),
        "risk_score": (context.risk.get("risk_score", 0) if isinstance(context.risk, dict) else 0),

        # =========================
        # FORECAST METRICS
        # =========================
        "predicted_demand": metrics.get("predicted_demand"),
        "confidence": metrics.get("confidence_score"),

        # =========================
        # OUTPUTS
        # =========================
        "alerts": context.alerts or [],
        "errors": context.errors or []
    }