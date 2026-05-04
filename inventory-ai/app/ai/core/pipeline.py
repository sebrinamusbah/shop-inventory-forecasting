from app.ai.core.inventory_context import InventoryContext


class InventoryPipeline:

    def __init__(self, db, prophet, decision, risk, explainer, alerts):
        self.db = db
        self.prophet = prophet
        self.decision = decision
        self.risk = risk
        self.explainer = explainer
        self.alerts = alerts

        self.steps = [
            self._forecast_step,
            self._decision_step,
            self._risk_step,
            self._explanation_step,
            self._alerts_step,
            self._build_outputs_step,
        ]

    # =============================
    # MAIN RUN (NO DB WRITES)
    # =============================
    def run(self, product_id: int, periods: int = 30):

        product = self.db.get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        sales_data = self.db.get_sales_history_cached(product_id)

        # =============================
        # CONTEXT (TEMP MEMORY ONLY)
        # =============================
        context = InventoryContext(
            product_id=product_id,
            sku=product.get("sku"),
            name=product.get("name"),
            category=product.get("category", "unknown")
        )

        context.sales_data = sales_data
        context.current_stock = product.get("current_quantity", 0)
        context.periods = periods

        # =============================
        # RUN AI PIPELINE
        # =============================
        for step in self.steps:
            self._execute_step(step, context)

        return context

    # =============================
    # SAFE EXECUTOR
    # =============================
    def _execute_step(self, step, context):
        try:
            step(context)
        except Exception as e:
            context.add_error(step.__name__, str(e))

    # =============================
    # 1. FORECAST
    # =============================
    def _forecast_step(self, context):

        context.forecast = self.prophet.predict(
            product={
                "id": context.product_id,
                "sku": context.sku,
                "name": context.name,
                "category": context.category,
                "current_stock": context.current_stock
            },
            sales_data=context.sales_data,
            periods=context.periods
        )

    # =============================
    # 2. DECISION
    # =============================
    def _decision_step(self, context):

        context.decision = self.decision.evaluate(
            context.forecast or {}
        )

    # =============================
    # 3. RISK
    # =============================
    def _risk_step(self, context):

        context.risk = self.risk.evaluate(
            context.forecast or {}
        )

    # =============================
    # 4. EXPLANATION (INSIGHT)
    # =============================
    def _explanation_step(self, context):

        context.explanation = self.explainer.explain(
            context.forecast,
            context.decision
        )

        context.insight_result = {
            "product_id": context.product_id,
            "product_name": context.name,
            "message": context.explanation,
            "insight_type": self._get_insight_type(context),
            "severity": self._get_severity(context),
            "reason_summary": context.decision.get("reason") if isinstance(context.decision, dict) else None
        }

    # =============================
    # 5. ALERTS
    # =============================
    def _alerts_step(self, context):

        alerts = self.alerts.generate_alerts(
            context.forecast,
            context.decision,
            context.risk
        )

        context.alerts = alerts
        context.alerts_result = []

        for a in alerts:
            context.alerts_result.append({
                "product_id": context.product_id,
                "product_name": context.name,
                "alert_message": a.get("message"),
                "alert_type": a.get("type"),
                "priority": a.get("priority", "low")
            })

    # =============================
    # 6. FINAL PREDICTION OUTPUT
    # =============================
    def _build_outputs_step(self, context):

        from datetime import date, timedelta

        forecast = context.forecast or {}

        metrics = forecast.get("metrics", {})
        trend = metrics.get("trend")
        if trend is None:
            predicted = metrics.get("predicted_demand", 0)
            if predicted > context.current_stock:
                trend = "up"
            elif predicted < context.current_stock:
                trend = "down"
            else:
                trend = "stable"

        context.prediction_result = {
            "product_id": context.product_id,
            "product_name": context.name,
            "predicted_demand": metrics.get("predicted_demand", 0),
            "current_stock": context.current_stock,
            "confidence_score": metrics.get("confidence_score", 0),
            "recommended_action": context.decision.get("action") if isinstance(context.decision, dict) else None,
            "risk_score": context.risk.get("risk_score", 0) if isinstance(context.risk, dict) else 0,
            "trend": trend,
            "forecast_start": date.today(),
            "forecast_end": date.today() + timedelta(days=context.periods)
        }

    # =============================
    # HELPERS
    # =============================
    def _get_insight_type(self, context):
        action = context.decision.get("action") if isinstance(context.decision, dict) else None

        if action == "RESTOCK":
            return "opportunity"
        elif action == "DROP":
            return "warning"
        return "trend"

    def _get_severity(self, context):
        risk = context.risk.get("risk_score", 0) if isinstance(context.risk, dict) else 0

        if risk > 0.5:
            return "high"
        elif risk > 0.25:
            return "medium"
        return "low"