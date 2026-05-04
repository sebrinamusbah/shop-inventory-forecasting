from app.ai.core.inventory_context import InventoryContext


class InventoryPipeline:

    def __init__(self, db, prophet, decision, risk, explainer, alerts):
        self.db = db  # only for reading data (OK)
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
            self._metadata_step,
        ]

    # =============================
    # MAIN RUN (NO DB WRITES)
    # =============================
    def run(self, product_id: int, periods: int = 30):

        product = self.db.get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        sales_data = self.db.get_sales_history_cached(product_id)

        # 🧠 CREATE CONTEXT (TEMP STORAGE ONLY)
        context = InventoryContext(
            product_id=product_id,
            sku=product.get("sku"),
            name=product.get("name"),
            category=product.get("category", "unknown")
        )

        context.sales_data = sales_data
        context.current_stock = product.get("current_quantity", 0)
        context.periods = periods

        # 🚀 RUN AI STEPS
        for step in self.steps:
            self._execute_step(step, context)

        # ❗ RETURN ONLY RESULT (NO DB)
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
    # 4. EXPLANATION
    # =============================
    def _explanation_step(self, context):
        context.explanation = self.explainer.explain(
            context.forecast,
            context.decision
        )

    # =============================
    # 5. ALERTS
    # =============================
    def _alerts_step(self, context):
        context.generated_alerts = self.alerts.generate_alerts(
            context.forecast,
            context.decision,
            context.risk
        )

    # =============================
    # 6. METADATA
    # =============================
    def _metadata_step(self, context):
        context.metadata = {
            "product_id": context.product_id,
            "periods": context.periods
        }