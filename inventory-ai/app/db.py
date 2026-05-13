from sqlalchemy import create_engine, text
import pandas as pd
from dotenv import load_dotenv
import logging
from datetime import datetime
from contextlib import contextmanager

load_dotenv()

logger = logging.getLogger(__name__)


class Database:

    def __init__(self, db_url: str):
        self.engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            future=True
        )
        logger.info("Database connection initialized")

    # =========================================================
    # TRANSACTION
    # =========================================================
    @contextmanager
    def transaction(self):
        with self.engine.begin() as conn:
            try:
                yield conn
            except Exception:
                logger.exception("❌ Transaction failed")
                raise

    # =========================================================
    # READ HELPERS
    # =========================================================
    def fetch_all(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                return result.mappings().all()
        except Exception:
            logger.exception("❌ fetch_all failed")
            return []

    def fetch_one(self, query: str, params: dict = None):
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                return result.mappings().first()
        except Exception:
            logger.exception("❌ fetch_one failed")
            return None

    # =========================================================
    # WRITE
    # =========================================================
    def execute(self, query: str, params: dict = None):
        try:
            with self.engine.begin() as conn:
                conn.execute(text(query), params or {})
        except Exception:
            logger.exception("❌ execute failed")
            raise

    # =========================================================
    # PRODUCT
    # =========================================================
    def get_product_by_id(self, product_id: int):
        query = """
        SELECT 
            id,
            name,
            sku,
            category_id,
            current_quantity,
            unit_buy_price,
            unit_sell_price,
            min_stock_level,
            is_active,
            total_sold_quantity
        FROM products
        WHERE id = :product_id
        """

        row = self.fetch_one(query, {"product_id": product_id})
        return dict(row) if row else None

    # =========================================================
    # ALL PRODUCT IDS
    # =========================================================
    def get_all_product_ids(self):
        rows = self.fetch_all("SELECT id FROM products WHERE is_active = 1")
        return [r["id"] for r in rows] if rows else []

    # =========================================================
    # SALES HISTORY
    # =========================================================
    def get_sales_history_cached(self, product_id: int, start_date=None, end_date=None):

        query = """
        SELECT 
            DATE(s.sale_date) as created_at,
            SUM(si.quantity) as quantity
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

        query += " GROUP BY DATE(s.sale_date) ORDER BY created_at ASC"

        rows = self.fetch_all(query, params)

        if not rows:
            return pd.DataFrame(columns=["ds", "y"])

        df = pd.DataFrame(rows)

        df["ds"] = pd.to_datetime(df["created_at"], errors="coerce")
        df["y"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)

        df = df.dropna(subset=["ds"])
        df = df.groupby("ds", as_index=False)["y"].sum()
        df = df.sort_values("ds").reset_index(drop=True)

        return df

    # =========================================================
    # PRODUCTS LIST
    # =========================================================
    def get_products(self):
        rows = self.fetch_all("""
            SELECT id, name, current_quantity
            FROM products
            WHERE is_active = 1
        """)
        return pd.DataFrame(rows)

    # =========================================================
    # KPI: SALES
    # =========================================================
    def get_product_sales(self, product_id: int):
        row = self.fetch_one("""
            SELECT SUM(si.subtotal) as total_sales
            FROM sale_items si
            WHERE si.product_id = :pid
        """, {"pid": product_id})

        return float(row["total_sales"]) if row and row["total_sales"] else 0.0

    # =========================================================
    # KPI: PROFIT
    # =========================================================
    def get_product_profit(self, product_id: int):
        row = self.fetch_one("""
            SELECT SUM(si.profit) as total_profit
            FROM sale_items si
            WHERE si.product_id = :pid
        """, {"pid": product_id})

        return float(row["total_profit"]) if row and row["total_profit"] else 0.0

    # =========================================================
    # SNAPSHOT UPSERT (FIXED + SAFE)
    # =========================================================
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
            (snapshot_date, total_sales, total_profit,
             top_product_id, low_stock_count, sales_trend,
             created_at, updated_at)
            VALUES
            (:snapshot_date, :total_sales, :total_profit,
             :top_product_id, :low_stock_count, :sales_trend,
             :created_at, :updated_at)
            """

        self.execute(query, params)