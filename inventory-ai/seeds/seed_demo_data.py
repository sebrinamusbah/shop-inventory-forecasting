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
    print("✅ Database reset completed")


# =========================
# SEED CATEGORIES
# =========================
def seed_categories():
    with db.engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO categories (name, description)
            VALUES
            ('Food', 'Daily food items'),
            ('Beverages', 'Drinks and liquids'),
            ('Household', 'Home essentials')
        """))
    print("✅ Categories seeded")


# =========================
# GET CATEGORIES MAP
# =========================
def get_categories():
    with db.engine.connect() as conn:
        result = conn.execute(text("SELECT id, name FROM categories")).mappings().all()
        return result


# =========================
# PRODUCT TEMPLATES
# =========================
PRODUCTS = [
    ("Rice", "FAST"), ("Sugar", "FAST"), ("Oil", "FAST"),
    ("Milk", "FAST"), ("Bread", "FAST"),

    ("Soap", "MED"), ("Coffee", "MED"), ("Tea", "MED"),
    ("Pasta", "MED"), ("Salt", "MED"),

    ("Chocolate", "SLOW"), ("Juice", "SLOW"),
    ("Biscuits", "SLOW"), ("Cereal", "SLOW"),
    ("Yogurt", "SLOW")
]


# =========================
# MAP PRODUCT → CATEGORY
# =========================
CATEGORY_MAP = {
    "Rice": "Food",
    "Sugar": "Food",
    "Oil": "Food",
    "Bread": "Food",
    "Pasta": "Food",

    "Milk": "Beverages",
    "Coffee": "Beverages",
    "Tea": "Beverages",
    "Juice": "Beverages",
    "Yogurt": "Beverages",

    "Soap": "Household",
    "Chocolate": "Household",
    "Biscuits": "Household",
    "Cereal": "Household",
    "Salt": "Household",
}


# =========================
# SEED PRODUCTS (FIXED)
# =========================
def seed_products():
    categories = get_categories()

    with db.engine.begin() as conn:
        for name, _ in PRODUCTS:

            category_name = CATEGORY_MAP.get(name)
            category_id = None

            for c in categories:
                if c["name"] == category_name:
                    category_id = c["id"]
                    break

            buy = random.randint(10, 80)
            sell = buy + random.randint(10, 50)

            conn.execute(text("""
                INSERT INTO products (
                    category_id,
                    name,
                    sku,
                    current_quantity,
                    unit_buy_price,
                    unit_sell_price,
                    min_stock_level,
                    is_active,
                    total_sold_quantity,
                    last_sold_at
                )
                VALUES (
                    :category_id,
                    :name,
                    :sku,
                    :qty,
                    :buy,
                    :sell,
                    :min_stock,
                    1,
                    0,
                    NULL
                )
            """), {
                "category_id": category_id,
                "name": name,
                "sku": f"SKU-{random.randint(1000,9999)}-{name[:3].upper()}",
                "qty": random.randint(50, 120),
                "buy": buy,
                "sell": sell,
                "min_stock": random.randint(5, 15)
            })

    print("✅ Products seeded")


# =========================
# DEMAND ENGINE
# =========================
def get_demand(product_type):
    if product_type == "FAST":
        return random.randint(5, 18)
    elif product_type == "MED":
        return random.randint(2, 8)
    return random.randint(0, 3)


# =========================
# GET PRODUCTS
# =========================
def get_products():
    with db.engine.connect() as conn:
        return conn.execute(text("""
            SELECT id, name, current_quantity, unit_buy_price, unit_sell_price
            FROM products
        """)).mappings().all()


# =========================
# SEED SALES
# =========================
def seed_sales(days=60):
    products = get_products()
    start_date = datetime.now() - timedelta(days=days)

    with db.engine.begin() as conn:
        for day in range(days):
            sale_date = start_date + timedelta(days=day)

            for _ in range(random.randint(5, 12)):

                sale_id = conn.execute(text("""
                    INSERT INTO sales (
                        user_id,
                        customer_name,
                        customer_phone,
                        total_amount,
                        payment_method,
                        sale_date,
                        status,
                        total_profit
                    )
                    VALUES (1, :name, :phone, 0, 'cash', :date, 'completed', 0)
                """), {
                    "name": f"Customer{random.randint(100,999)}",
                    "phone": f"0911{random.randint(100000,999999)}",
                    "date": sale_date
                }).lastrowid

                total = 0
                profit = 0

                for _ in range(random.randint(1, 3)):

                    product = random.choice(products)

                    if product["name"] in ["Rice", "Sugar", "Oil", "Milk", "Bread"]:
                        ptype = "FAST"
                    elif product["name"] in ["Soap", "Coffee", "Tea", "Pasta", "Salt"]:
                        ptype = "MED"
                    else:
                        ptype = "SLOW"

                    qty = get_demand(ptype)
                    if qty == 0:
                        continue

                    unit_cost = product["unit_buy_price"]
                    unit_price = product["unit_sell_price"]

                    subtotal = qty * unit_price
                    cost_total = qty * unit_cost
                    item_profit = subtotal - cost_total

                    new_stock = max(0, product["current_quantity"] - qty)

                    conn.execute(text("""
                        INSERT INTO sale_items (
                            sale_id, product_id, quantity,
                            unit_price, unit_cost,
                            subtotal, profit,
                            stock_after_sale, cost_total
                        )
                        VALUES (
                            :sale_id, :product_id, :qty,
                            :unit_price, :unit_cost,
                            :subtotal, :profit,
                            :stock_after_sale, :cost_total
                        )
                    """), {
                        "sale_id": sale_id,
                        "product_id": product["id"],
                        "qty": qty,
                        "unit_price": unit_price,
                        "unit_cost": unit_cost,
                        "subtotal": subtotal,
                        "profit": item_profit,
                        "stock_after_sale": new_stock,
                        "cost_total": cost_total
                    })

                    total += subtotal
                    profit += item_profit

                    conn.execute(text("""
                        UPDATE products
                        SET current_quantity = :qty,
                            total_sold_quantity = total_sold_quantity + :sold,
                            last_sold_at = NOW()
                        WHERE id = :id
                    """), {
                        "qty": new_stock,
                        "sold": qty,
                        "id": product["id"]
                    })

                conn.execute(text("""
                    UPDATE sales
                    SET total_amount = :total,
                        total_profit = :profit
                    WHERE id = :id
                """), {
                    "total": total,
                    "profit": profit,
                    "id": sale_id
                })

    print("✅ AI-ready sales data generated")


# =========================
# RUN ORDER (IMPORTANT)
# =========================
if __name__ == "__main__":
    reset_data()
    seed_categories()
    seed_products()
    seed_sales(60)