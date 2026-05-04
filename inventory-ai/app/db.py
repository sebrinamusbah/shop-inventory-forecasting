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

        logger.info("✅ Database connection initialized")

    # =============================
    # CORE READ
    # =============================
    def fetch_all(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                rows = result.mappings().all()

                logger.info(f"fetch_all → {len(rows)} rows")
                return rows

        except Exception as e:
            logger.exception(f"fetch_all failed: {e}")
            raise

    def fetch_one(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                row = result.mappings().first()

                logger.info("fetch_one executed")
                return row

        except Exception as e:
            logger.exception(f"fetch_one failed: {e}")
            raise

    # =============================
    # CORE WRITE
    # =============================
    def execute(self, query: str, params: dict = None):
        try:
            with self.engine.begin() as conn:
                conn.execute(text(query), params or {})

                logger.info("execute successful")

        except Exception as e:
            logger.exception(f"execute failed: {e}")
            raise

    # =============================
    # PRODUCT IDS
    # =============================
    def get_all_product_ids(self):
        query = "SELECT id FROM products WHERE is_active = 1"

        rows = self.fetch_all(query)
        return [row["id"] for row in rows] if rows else []

    # =============================
    # PRODUCT BY ID
    # =============================
    def get_product_by_id(self, product_id: int) -> Optional[Dict[str, Any]]:
        query = """
        SELECT 
            id, name, sku,category_id,
            current_quantity,
            unit_buy_price, unit_sell_price,
            min_stock_level, is_active,
            total_sold_quantity
        FROM products
        WHERE id = :product_id
        """

        row = self.fetch_one(query, {"product_id": product_id})

        if not row:
            return None

        return {
            "id": row["id"],
            "name": row["name"],
            "sku": row["sku"],
            "category_id": row["category_id"] or "unknown",
            "current_quantity": int(row["current_quantity"] or 0),
            "unit_buy_price": float(row["unit_buy_price"] or 0),
            "unit_sell_price": float(row["unit_sell_price"] or 0),
            "min_stock_level": int(row["min_stock_level"] or 0),
            "is_active": bool(row["is_active"] or 0),
            "total_sold_quantity": int(row["total_sold_quantity"] or 0)
        }

    # =============================
    # SALES HISTORY
    # =============================
    def get_sales_history_cached(self, product_id: int, start_date=None, end_date=None):

        query = """
        SELECT DATE(s.sale_date) as ds, SUM(si.quantity) as y
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE si.product_id = :product_id
        """

        params = {"product_id": product_id}

        if start_date:
            query += " AND s.sale_date >= :start_date"
            params["start_date"] = start_date

        if end_date:
            query += " AND s.sale_date <= :end_date"
            params["end_date"] = end_date

        query += " GROUP BY DATE(s.sale_date) ORDER BY ds ASC"

        rows = self.fetch_all(query, params)

        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["ds", "y"])

        if not df.empty:
            df["ds"] = pd.to_datetime(df["ds"])
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

        return df

    # =============================
    # PRODUCTS LIST
    # =============================
    def get_products(self):

        query = """
        SELECT id, name, current_quantity 
        FROM products
        WHERE is_active = 1
        ORDER BY name ASC
        """

        rows = self.fetch_all(query)

        return pd.DataFrame(rows) if rows else pd.DataFrame(
            columns=["id", "name", "current_quantity"]
        )

    # =============================
    # FULL PRODUCTS
    # =============================
    def get_all_products_full(self):

        query = """
        SELECT id, name, sku, category,
               current_quantity,
               min_stock_level,
               total_sold_quantity,
               is_active
        FROM products
        ORDER BY id DESC
        """

        rows = self.fetch_all(query)

        return pd.DataFrame(rows) if rows else pd.DataFrame(columns=[
            "id", "name", "sku", "category",
            "current_quantity", "min_stock_level",
            "total_sold_quantity", "is_active"
        ])

    # =============================
    # SNAPSHOT UPSERT (FIXED)
    # =============================
    def upsert_ai_snapshot(
        self,
        snapshot_date,
        total_sales,
        total_profit,
        top_product_id,
        low_stock_count,
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

            params = {
                "snapshot_date": snapshot_date,
                "total_sales": total_sales,
                "total_profit": total_profit,
                "top_product_id": top_product_id,
                "low_stock_count": low_stock_count,
                "sales_trend": sales_trend,
                "updated_at": now
            }

        else:
            query = """
            INSERT INTO ai_snapshots
            (snapshot_date, total_sales, total_profit,
             top_product_id, low_stock_count, sales_trend,
             created_at, updated_at)
            VALUES (:snapshot_date, :total_sales, :total_profit,
                    :top_product_id, :low_stock_count, :sales_trend,
                    :created_at, :updated_at)
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