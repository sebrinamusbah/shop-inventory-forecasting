from sqlalchemy import create_engine, text
import pandas as pd
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any
from datetime import datetime

load_dotenv()

logger = logging.getLogger(__name__)


class Database:
    """
    Production-ready AI Engine DB layer
    """

    def __init__(self, db_url: str):
        self.engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )

    # =============================
    # CORE EXECUTION
    # =============================
    def fetch_all(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                return result.mappings().all()
        except Exception as e:
            logger.exception(f"fetch_all failed: {e}")
            raise

    def fetch_one(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                return result.mappings().first()
        except Exception as e:
            logger.exception(f"fetch_one failed: {e}")
            raise

    def execute(self, query: str, params: dict = None):
        try:
            with self.engine.begin() as conn:
                conn.execute(text(query), params or {})
        except Exception as e:
            logger.exception(f"execute failed: {e}")
            raise

    # =============================
    # DATE HANDLING
    # =============================
    def _to_datetime(self, value):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        return pd.to_datetime(value)

    # =============================
    # SALES HISTORY (NO BROKEN CACHE)
    # =============================
    def get_sales_history_cached(
        self,
        product_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ):

        query = """
        SELECT 
            DATE(s.sale_date) as ds,
            SUM(si.quantity) as y
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE si.product_id = :product_id
        """

        params = {"product_id": product_id}

        start_dt = self._to_datetime(start_date)
        end_dt = self._to_datetime(end_date)

        if start_dt is not None:
            query += " AND s.sale_date >= :start_date"
            params["start_date"] = start_dt

        if end_dt is not None:
            query += " AND s.sale_date <= :end_date"
            params["end_date"] = end_dt

        query += """
        GROUP BY DATE(s.sale_date)
        ORDER BY ds ASC
        """

        rows = self.fetch_all(query, params)

        df = pd.DataFrame(rows, columns=["ds", "y"]) if rows else pd.DataFrame(columns=["ds", "y"])

        if not df.empty:
            df["ds"] = pd.to_datetime(df["ds"])
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

        return df

    # =============================
    # PRODUCT LOOKUP
    # =============================
    def get_product_by_id(self, product_id: int) -> Optional[Dict[str, Any]]:

        query = """
        SELECT 
            id,
            name,
            sku,
            current_quantity,
            unit_buy_price,
            unit_sell_price,
            min_stock_level,
            is_active,
            total_sold_quantity
        FROM products
        WHERE id = :product_id
        LIMIT 1
        """

        row = self.fetch_one(query, {"product_id": product_id})

        if not row:
            return None

        return {
            "id": row["id"],
            "name": row["name"],
            "sku": row["sku"],
            "current_quantity": int(row["current_quantity"] or 0),
            "unit_buy_price": float(row["unit_buy_price"] or 0),
            "unit_sell_price": float(row["unit_sell_price"] or 0),
            "min_stock_level": int(row["min_stock_level"] or 0),
            "is_active": bool(row["is_active"]),
            "total_sold_quantity": int(row["total_sold_quantity"] or 0)
        }

    # =============================
    # PRODUCTS LIST
    # =============================
    def get_products(self) -> pd.DataFrame:

        query = """
        SELECT id, name, current_quantity 
        FROM products
        WHERE is_active = 1
        ORDER BY name ASC
        """

        rows = self.fetch_all(query)

        return pd.DataFrame(rows, columns=["id", "name", "current_quantity"]) if rows else pd.DataFrame(
            columns=["id", "name", "current_quantity"]
        )

    # =============================
    # FULL PRODUCTS TABLE
    # =============================
    def get_all_products_full(self) -> pd.DataFrame:

        query = """
        SELECT 
            id,
            name,
            sku,
            current_quantity,
            min_stock_level,
            total_sold_quantity,
            is_active
        FROM products
        ORDER BY id DESC
        """

        rows = self.fetch_all(query)

        return pd.DataFrame(rows, columns=[
            "id",
            "name",
            "sku",
            "current_quantity",
            "min_stock_level",
            "total_sold_quantity",
            "is_active"
        ]) if rows else pd.DataFrame(columns=[
            "id",
            "name",
            "sku",
            "current_quantity",
            "min_stock_level",
            "total_sold_quantity",
            "is_active"
        ])

    # =============================
    # AI TABLE WRITES
    # =============================
    def replace_ai_prediction(
        self,
        product_id: int,
        forecast_type: str,
        predicted_demand: int,
        confidence_score: float,
        recommended_action: str,
        forecast_start,
        forecast_end
    ):
        delete_query = """
        DELETE FROM ai_predictions
        WHERE product_id = :product_id
          AND forecast_type = :forecast_type
          AND forecast_start = :forecast_start
          AND forecast_end = :forecast_end
        """

        insert_query = """
        INSERT INTO ai_predictions
        (product_id, forecast_type, predicted_demand, confidence_score, recommended_action, forecast_start, forecast_end, created_at, updated_at)
        VALUES (:product_id, :forecast_type, :predicted_demand, :confidence_score, :recommended_action, :forecast_start, :forecast_end, :created_at, :updated_at)
        """

        now = datetime.utcnow()

        params = {
            "product_id": product_id,
            "forecast_type": forecast_type,
            "predicted_demand": int(predicted_demand),
            "confidence_score": confidence_score,
            "recommended_action": recommended_action,
            "forecast_start": forecast_start,
            "forecast_end": forecast_end,
            "created_at": now,
            "updated_at": now
        }

        self.execute(delete_query, params)
        self.execute(insert_query, params)

    def insert_ai_insight(
        self,
        product_id,
        insight_type: str,
        message: str,
        severity: str
    ):
        query = """
        INSERT INTO ai_insights
        (product_id, type, message, severity, created_at, updated_at)
        VALUES (:product_id, :type, :message, :severity, :created_at, :updated_at)
        """

        now = datetime.utcnow()

        self.execute(query, {
            "product_id": product_id,
            "type": insight_type,
            "message": message,
            "severity": severity,
            "created_at": now,
            "updated_at": now
        })

    def upsert_ai_snapshot(
        self,
        snapshot_date,
        total_sales: float,
        total_profit: float,
        top_product_id,
        low_stock_count: int,
        sales_trend
    ):
        existing = self.fetch_one(
            "SELECT id FROM ai_snapshots WHERE snapshot_date = :snapshot_date",
            {"snapshot_date": snapshot_date}
        )

        now = datetime.utcnow()

        if existing:
            query = """
            UPDATE ai_snapshots
            SET total_sales = :total_sales,
                total_profit = :total_profit,
                top_product_id = :top_product_id,
                low_stock_count = :low_stock_count,
                sales_trend = :sales_trend,
                updated_at = :updated_at
            WHERE snapshot_date = :snapshot_date
            """
        else:
            query = """
            INSERT INTO ai_snapshots
            (snapshot_date, total_sales, total_profit, top_product_id, low_stock_count, sales_trend, created_at, updated_at)
            VALUES (:snapshot_date, :total_sales, :total_profit, :top_product_id, :low_stock_count, :sales_trend, :created_at, :updated_at)
            """

        params = {
            "snapshot_date": snapshot_date,
            "total_sales": total_sales,
            "total_profit": total_profit,
            "top_product_id": top_product_id,
            "low_stock_count": low_stock_count,
            "sales_trend": sales_trend,
            "created_at": now,
            "updated_at": now
        }

        self.execute(query, params)