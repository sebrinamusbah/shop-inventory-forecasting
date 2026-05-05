def to_api_response(context):
    return {
        "product_id": context.product_id,

        "action": context.decision.get("action") if context.decision else None,
        "recommended_order": context.decision.get("recommended_order") if context.decision else None,

        "risk_level": context.risk.get("risk_level") if context.risk else None,
        "risk_score": context.risk.get("risk_score") if context.risk else None,

        "predicted_demand": (
            context.forecast.get("metrics", {}).get("predicted_demand")
            if context.forecast else None
        ),

        "confidence": (
            context.forecast.get("metrics", {}).get("confidence_score")
            if context.forecast else None
        ),

        "alerts": context.alerts or [],
        "errors": context.errors or []
    }