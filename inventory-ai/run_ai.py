import sys
import os
import json
import argparse
from datetime import date, timedelta
import pandas as pd

# =============================
# ROOT SETUP
# =============================
ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.append(ROOT_DIR)

print("ROOT:", ROOT_DIR)

# =============================
# ENV LOAD (IMPORTANT FIX)
# =============================
from dotenv import load_dotenv

env_path = os.path.join(ROOT_DIR, ".env")
load_dotenv(env_path)

DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    raise Exception(" DATABASE_URL not found in .env")

# =============================
# IMPORTS
# =============================
from app.db import Database
from app.prophet_engine import run_forecast
from app.ai.engines.decision_engine import DecisionEngine
from app.ai.engines.risk_engine import RiskEngine
from app.ai.engines.alert_engine import AlertEngine


# =============================
# PROCESS PRODUCT
# =============================
def process_product(product, sales_data):

    forecast = run_forecast(product, sales_data)

    decision = DecisionEngine().evaluate(forecast)
    risk = RiskEngine().evaluate(forecast)

    alerts = AlertEngine().generate_alerts(forecast, decision, risk)

    return {
        "product_id": product.get("id"),
        "forecast": forecast,
        "decision": decision,
        "risk": risk,
        "alerts": alerts
    }


# =============================
# FORMAT FOR LARAVEL
# =============================
def format_ai_output(result):
    decision = result.get("decision", {}) or {}
    recommended_order = decision.get("recommended_order")

    if recommended_order is None:
        recommended_order = decision.get("recommended_purchase_qty")

    return {
        "product_id": result.get("product_id"),

        "action": result.get("decision", {}).get("action"),

        # ✅ FIXED FIELD NAME
        "recommended_order": recommended_order,

        "risk_level": result.get("risk", {}).get("risk_level"),
        "risk_score": result.get("risk", {}).get("risk_score"),

        "predicted_demand": result.get("forecast", {}).get("metrics", {}).get("predicted_demand"),
        "confidence": result.get("forecast", {}).get("metrics", {}).get("confidence_score"),

        "alerts": result.get("alerts", [])
    }

# =============================
# PIPELINE
# =============================
def run_pipeline(products, db):

    results = []

    for product in products:
        try:
            sales_data = db.get_sales_history_cached(product["id"])

            result = process_product(product, sales_data)

            results.append(format_ai_output(result))

        except Exception as e:
            results.append({
                "product_id": product.get("id"),
                "error": str(e)
            })

    return results


def _alert_to_insight(alert):
    alert_type = alert.get("type")
    priority = alert.get("priority", "low")

    if priority == "HIGH":
        severity = "high"
    elif priority == "MEDIUM":
        severity = "medium"
    else:
        severity = "low"

    if alert_type == "RESTOCK_REQUIRED":
        insight_type = "opportunity"
    else:
        insight_type = "warning"

    return insight_type, severity


def write_hourly_results(results, db):
    today = date.today()
    forecast_start = today
    forecast_end = today + timedelta(days=30)

    for result in results:
        if result.get("error"):
            continue

        product_id = result.get("product_id")

        action = result.get("action")
        recommended_order = result.get("recommended_order")

        recommended_action = action or "NO_ACTION"
        if recommended_order not in [None, 0]:
            recommended_action = f"{recommended_action} (qty={int(recommended_order)})"

        predicted_demand = int(result.get("predicted_demand") or 0)
        confidence = result.get("confidence")

        db.replace_ai_prediction(
            product_id=product_id,
            forecast_type="30d",
            predicted_demand=predicted_demand,
            confidence_score=confidence,
            recommended_action=recommended_action,
            forecast_start=forecast_start,
            forecast_end=forecast_end
        )

        for alert in result.get("alerts", []):
            insight_type, severity = _alert_to_insight(alert)

            db.insert_ai_insight(
                product_id=product_id,
                insight_type=insight_type,
                message=alert.get("message", ""),
                severity=severity
            )


def write_daily_snapshot(db):
    today = date.today()
    yesterday = today - timedelta(days=1)

    totals = db.fetch_one(
        """
        SELECT
            COALESCE(SUM(s.total_amount), 0) AS total_sales,
            COALESCE(SUM(si.profit), 0) AS total_profit
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE DATE(s.sale_date) = :snapshot_date
        """,
        {"snapshot_date": today}
    )

    top_product = db.fetch_one(
        """
        SELECT si.product_id, SUM(si.quantity) AS qty
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE DATE(s.sale_date) = :snapshot_date
        GROUP BY si.product_id
        ORDER BY qty DESC
        LIMIT 1
        """,
        {"snapshot_date": today}
    )

    low_stock = db.fetch_one(
        """
        SELECT COUNT(*) AS low_stock_count
        FROM products
        WHERE is_active = 1
          AND current_quantity <= min_stock_level
        """
    )

    prev = db.fetch_one(
        """
        SELECT COALESCE(SUM(total_amount), 0) AS total_sales
        FROM sales
        WHERE DATE(sale_date) = :snapshot_date
        """,
        {"snapshot_date": yesterday}
    )

    prev_total = float(prev["total_sales"] or 0)
    current_total = float(totals["total_sales"] or 0)

    if prev_total <= 0 and current_total > 0:
        trend = "up"
    elif prev_total > 0 and current_total <= 0:
        trend = "down"
    else:
        diff = current_total - prev_total
        if abs(diff) <= max(1.0, prev_total * 0.05):
            trend = "stable"
        elif diff > 0:
            trend = "up"
        else:
            trend = "down"

    db.upsert_ai_snapshot(
        snapshot_date=today,
        total_sales=float(totals["total_sales"] or 0),
        total_profit=float(totals["total_profit"] or 0),
        top_product_id=top_product["product_id"] if top_product else None,
        low_stock_count=int(low_stock["low_stock_count"] or 0),
        sales_trend=trend
    )


# =============================
# MAIN
# =============================
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["hourly", "daily", "all"], default="all")
    args = parser.parse_args()

    db = Database(DB_URL)

    products_df = db.get_products()
    products = products_df.to_dict(orient="records")

    print("PRODUCTS:", len(products))

    results = run_pipeline(products, db)

    if args.mode in ["hourly", "all"]:
        write_hourly_results(results, db)

    if args.mode in ["daily", "all"]:
        write_daily_snapshot(db)

    print(json.dumps(results, default=str, indent=2))


if __name__ == "__main__":
    main()
