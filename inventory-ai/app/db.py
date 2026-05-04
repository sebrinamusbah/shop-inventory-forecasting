from sqlalchemy import create_engine, text
import pandas as pd
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any

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
    # CORE READ OPERATIONS
    # =============================
    def fetch_all(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                rows = result.mappings().all()

                logger.info(f"fetch_all executed → {len(rows)} rows")
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
    # CORE WRITE OPERATIONS
    # =============================
    def execute(self, query: str, params: dict = None):
        """
        Used for INSERT / UPDATE / DELETE
        """
        try:
            with self.engine.begin() as conn:
                result = conn.execute(text(query), params or {})

                logger.info("execute query successful")
                return result

        except Exception as e:
            logger.exception(f"execute failed: {e}")
            raise

    # =============================
    # PRODUCT IDS
    # =============================
    def get_all_product_ids(self):
        query = """
        SELECT id 
        FROM products 
        WHERE is_active = 1
        """

        rows = self.fetch_all(query)

        product_ids = [row["id"] for row in rows] if rows else []

        logger.info(f"Loaded product IDs: {len(product_ids)}")
        return product_ids

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
            logger.warning(f"Product not found: {product_id}")
            return None

        return {
            "id": row["id"],
            "name": row["name"],
            "sku": row["sku"],
            "current_quantity": int(row["current_quantity"] or 0),
            "unit_buy_price": float(row["unit_buy_price"] or 0),
            "unit_sell_price": float(row["unit_sell_price"] or 0),
            "min_stock_level": int(row["min_stock_level"] or 0),

            # ✅ FIXED LINE
            "is_active": bool(row["is_active"] or 0),

            "total_sold_quantity": int(row["total_sold_quantity"] or 0)
        }

    # =============================
    # SALES HISTORY
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

        if start_date:
            query += " AND s.sale_date >= :start_date"
            params["start_date"] = start_date

        if end_date:
            query += " AND s.sale_date <= :end_date"
            params["end_date"] = end_date

        query += """
        GROUP BY DATE(s.sale_date)
        ORDER BY ds ASC
        """

        rows = self.fetch_all(query, params)

        # ✅ FIX: safe DataFrame creation
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["ds", "y"])

        if not df.empty:
            df["ds"] = pd.to_datetime(df["ds"])
            df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

        logger.info(f"Sales history loaded → {len(df)} rows")
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

        # ✅ FIX: safe DataFrame creation
        df = pd.DataFrame(rows) if rows else pd.DataFrame(
            columns=["id", "name", "current_quantity"]
        )

        logger.info(f"Products loaded → {len(df)} rows")
        return df