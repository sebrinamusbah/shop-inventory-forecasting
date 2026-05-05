import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import Database

db = Database("mysql+pymysql://root:@localhost/small_shop_db")


# =========================
# RESET
# =========================
def reset_data():
    with db.engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.execute(text("DELETE FROM sale_items"))
        conn.execute(text("DELETE FROM sales"))
        conn.execute(text("DELETE FROM products"))
        conn.execute(text("DELETE FROM categories"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
    print("✅ Reset done")


# =========================
# SEED CATEGORIES (FIXED)
# =========================
def seed_categories():
    now = datetime.now()

    with db.engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO categories (name, description, created_at, updated_at)
            VALUES
            ('Food','Food items',:now,:now),
            ('Beverages','Drinks',:now,:now),
            ('Household','Home goods',:now,:now)
        """), {"now": now})

    print("✅ Categories seeded")


# =========================
# PRODUCTS
# =========================
PRODUCTS = [
    ("Rice","FAST"), ("Sugar","FAST"), ("Oil","FAST"),
    ("Milk","FAST"), ("Bread","FAST"),

    ("Soap","MED"), ("Coffee","MED"), ("Tea","MED"),
    ("Pasta","MED"), ("Salt","MED"),

    ("Chocolate","SLOW"), ("Juice","SLOW"),
    ("Biscuits","SLOW"), ("Cereal","SLOW"),
    ("Yogurt","SLOW")
]

CATEGORY_MAP = {
    "Rice":"Food","Sugar":"Food","Oil":"Food","Bread":"Food","Pasta":"Food",
    "Milk":"Beverages","Coffee":"Beverages","Tea":"Beverages",
    "Juice":"Beverages","Yogurt":"Beverages",
    "Soap":"Household","Chocolate":"Household","Biscuits":"Household",
    "Cereal":"Household","Salt":"Household"
}


# =========================
# SEED PRODUCTS (FIXED)
# =========================
def seed_products():

    now = datetime.now()

    with db.engine.begin() as conn:

        categories = conn.execute(text("SELECT id,name FROM categories")).mappings().all()

        for name,_ in PRODUCTS:

            cat_name = CATEGORY_MAP[name]
            cat_id = next(c["id"] for c in categories if c["name"] == cat_name)

            conn.execute(text("""
                INSERT INTO products (
                    category_id,name,sku,current_quantity,
                    unit_buy_price,unit_sell_price,
                    min_stock_level,is_active,
                    total_sold_quantity,last_sold_at,
                    created_at,updated_at
                )
                VALUES (
                    :cat,:name,:sku,:qty,
                    :buy,:sell,
                    :min,1,0,NULL,
                    :now,:now
                )
            """), {
                "cat":cat_id,
                "name":name,
                "sku":f"SKU-{random.randint(1000,9999)}",
                "qty":random.randint(80,150),
                "buy":random.randint(10,80),
                "sell":random.randint(90,150),
                "min":random.randint(5,15),
                "now":now
            })

    print("✅ Products seeded")


# =========================
# DEMAND
# =========================
def demand(level):
    if level=="FAST":
        return random.randint(5,18)
    if level=="MED":
        return random.randint(2,8)
    return random.randint(0,3)


# =========================
# SEED SALES (FULL AI TIME CONSISTENCY)
# =========================
def seed_sales(days=60):

    products = db.fetch_all("SELECT * FROM products")
    start = datetime.now() - timedelta(days=days)

    with db.engine.begin() as conn:

        for i in range(days):

            day = start + timedelta(days=i)

            for _ in range(random.randint(3,7)):

                sale_id = conn.execute(text("""
                    INSERT INTO sales (
                        user_id, customer_name, customer_phone,
                        total_amount, payment_method,
                        sale_date, status, total_profit,
                        created_at, updated_at
                    )
                    VALUES (
                        1,:name,:phone,
                        0,'cash',
                        :date,'completed',0,
                        :now,:now
                    )
                """), {
                    "name":f"Customer{random.randint(100,999)}",
                    "phone":f"0911{random.randint(100000,999999)}",
                    "date":day,
                    "now":day
                }).lastrowid

                total = 0
                profit = 0

                for _ in range(random.randint(1,3)):

                    p = random.choice(products)

                    level = "FAST" if p["name"] in ["Rice","Sugar","Oil","Milk","Bread"] else "MED"

                    qty = demand(level)
                    if qty == 0:
                        continue

                    subtotal = qty * p["unit_sell_price"]
                    cost = qty * p["unit_buy_price"]

                    conn.execute(text("""
                        INSERT INTO sale_items (
                            sale_id, product_id, quantity,
                            unit_price, unit_cost,
                            subtotal, profit,
                            stock_after_sale, cost_total,
                            created_at, updated_at
                        )
                        VALUES (
                            :sale,:pid,:qty,
                            :price,:cost,
                            :sub,:profit,
                            0,:cost_total,
                            :now,:now
                        )
                    """), {
                        "sale":sale_id,
                        "pid":p["id"],
                        "qty":qty,
                        "price":p["unit_sell_price"],
                        "cost":p["unit_buy_price"],
                        "sub":subtotal,
                        "profit":subtotal-cost,
                        "cost_total":cost,
                        "now":day
                    })

                    total += subtotal
                    profit += (subtotal-cost)

                conn.execute(text("""
                    UPDATE sales
                    SET total_amount=:t,
                        total_profit=:p,
                        updated_at=:now
                    WHERE id=:id
                """), {
                    "t":total,
                    "p":profit,
                    "id":sale_id,
                    "now":day
                })

    print("✅ FULL AI-ready dataset generated")


# =========================
# RUN
# =========================
if __name__ == "__main__":
    reset_data()
    seed_categories()
    seed_products()
    seed_sales(60)