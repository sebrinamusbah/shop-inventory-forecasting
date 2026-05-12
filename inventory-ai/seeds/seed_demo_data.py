import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import Database

db = Database("mysql+pymysql://root:@localhost/smallshop")


# =========================================
# RESET DATABASE
# =========================================
def reset_data():

    with db.engine.begin() as conn:

        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))

        conn.execute(text("DELETE FROM sale_items"))
        conn.execute(text("DELETE FROM sales"))
        conn.execute(text("DELETE FROM products"))
        conn.execute(text("DELETE FROM categories"))

        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

    print("✅ Database reset complete")


# =========================================
# SEED CATEGORIES
# =========================================
def seed_categories():

    now = datetime.now()

    with db.engine.begin() as conn:

        conn.execute(text("""
            INSERT INTO categories (
                name,
                description,
                created_at,
                updated_at
            )
            VALUES
            ('Food','Food items',:now,:now),
            ('Beverages','Drinks',:now,:now),
            ('Household','Home goods',:now,:now)
        """), {
            "now": now
        })

    print("✅ Categories seeded")


# =========================================
# PRODUCT DEFINITIONS
# =========================================
PRODUCTS = [

    # FAST MOVING
    ("Rice", "FAST"),
    ("Sugar", "FAST"),
    ("Oil", "FAST"),
    ("Milk", "FAST"),
    ("Bread", "FAST"),

    # MEDIUM
    ("Soap", "MED"),
    ("Coffee", "MED"),
    ("Tea", "MED"),
    ("Pasta", "MED"),
    ("Salt", "MED"),

    # SLOW
    ("Chocolate", "SLOW"),
    ("Juice", "SLOW"),
    ("Biscuits", "SLOW"),
    ("Cereal", "SLOW"),
    ("Yogurt", "SLOW"),
]

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


# =========================================
# SEED PRODUCTS
# =========================================
def seed_products():

    now = datetime.now()

    with db.engine.begin() as conn:

        categories = conn.execute(
            text("SELECT id,name FROM categories")
        ).mappings().all()

        for name, speed in PRODUCTS:

            cat_name = CATEGORY_MAP[name]

            cat_id = next(
                c["id"]
                for c in categories
                if c["name"] == cat_name
            )

            # =====================================
            # REALISTIC STOCK CONDITIONS
            # =====================================

            # HIGH RISK / LOW STOCK
            if name in ["Rice", "Sugar", "Oil"]:

                qty = random.randint(3, 12)
                min_stock = 15

            # OVERSTOCK
            elif name in ["Soap", "Salt"]:

                qty = random.randint(250, 400)
                min_stock = 20

            # DEAD STOCK
            elif name in ["Cereal"]:

                qty = random.randint(180, 250)
                min_stock = 10

            # NORMAL PRODUCTS
            else:

                qty = random.randint(40, 120)
                min_stock = random.randint(8, 20)

            buy_price = random.randint(10, 80)

            sell_price = buy_price + random.randint(15, 60)

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
                    last_sold_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    :cat,
                    :name,
                    :sku,
                    :qty,
                    :buy,
                    :sell,
                    :min,
                    1,
                    0,
                    NULL,
                    :now,
                    :now
                )
            """), {
                "cat": cat_id,
                "name": name,
                "sku": f"SKU-{random.randint(1000,9999)}",
                "qty": qty,
                "buy": buy_price,
                "sell": sell_price,
                "min": min_stock,
                "now": now
            })

    print("✅ Products seeded")


# =========================================
# DEMAND ENGINE
# =========================================
def demand(product_name, level):

    # =====================================
    # EXTREME FAST SELLERS
    # =====================================
    if product_name in ["Rice", "Sugar"]:

        return random.randint(15, 35)

    # =====================================
    # TRENDING PRODUCTS
    # =====================================
    if product_name in ["Milk", "Bread"]:

        return random.randint(8, 20)

    # =====================================
    # MEDIUM PRODUCTS
    # =====================================
    if level == "MED":

        return random.randint(2, 8)

    # =====================================
    # DEAD STOCK
    # =====================================
    if product_name in ["Cereal"]:

        return random.randint(0, 1)

    # =====================================
    # SLOW PRODUCTS
    # =====================================
    return random.randint(0, 3)


# =========================================
# SEED SALES
# =========================================
def seed_sales(days=60):

    products = db.fetch_all("SELECT * FROM products")

    start = datetime.now() - timedelta(days=days)

    with db.engine.begin() as conn:

        for i in range(days):

            day = start + timedelta(days=i)

            # =====================================
            # WEEKEND SALES SPIKES
            # =====================================
            if day.weekday() in [5, 6]:

                sale_count = random.randint(8, 15)

            else:

                sale_count = random.randint(3, 7)

            for _ in range(sale_count):

                sale_id = conn.execute(text("""
                    INSERT INTO sales (
                        user_id,
                        customer_name,
                        customer_phone,
                        total_amount,
                        payment_method,
                        sale_date,
                        status,
                        total_profit,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        1,
                        :name,
                        :phone,
                        0,
                        'cash',
                        :date,
                        'completed',
                        0,
                        :now,
                        :now
                    )
                """), {
                    "name": f"Customer{random.randint(100,999)}",
                    "phone": f"0911{random.randint(100000,999999)}",
                    "date": day,
                    "now": day
                }).lastrowid

                total = 0
                profit = 0

                # =====================================
                # ITEMS PER SALE
                # =====================================
                for _ in range(random.randint(1, 4)):

                    p = random.choice(products)

                    level = "FAST" if p["name"] in [
                        "Rice",
                        "Sugar",
                        "Oil",
                        "Milk",
                        "Bread"
                    ] else "MED"

                    qty = demand(p["name"], level)

                    if qty <= 0:
                        continue

                    subtotal = qty * p["unit_sell_price"]

                    cost_total = qty * p["unit_buy_price"]

                    item_profit = subtotal - cost_total

                    conn.execute(text("""
                        INSERT INTO sale_items (
                            sale_id,
                            product_id,
                            quantity,
                            unit_price,
                            unit_cost,
                            subtotal,
                            profit,
                            stock_after_sale,
                            cost_total,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            :sale,
                            :pid,
                            :qty,
                            :price,
                            :cost,
                            :subtotal,
                            :profit,
                            0,
                            :cost_total,
                            :now,
                            :now
                        )
                    """), {
                        "sale": sale_id,
                        "pid": p["id"],
                        "qty": qty,
                        "price": p["unit_sell_price"],
                        "cost": p["unit_buy_price"],
                        "subtotal": subtotal,
                        "profit": item_profit,
                        "cost_total": cost_total,
                        "now": day
                    })

                    total += subtotal
                    profit += item_profit

                    # =====================================
                    # UPDATE PRODUCT INVENTORY
                    # =====================================
                    current_qty = p["current_quantity"] or 0

                    new_qty = max(
                     0,
                    current_qty - qty
)

                    conn.execute(text("""
    UPDATE products
    SET
        current_quantity = :qty,
        total_sold_quantity =
            total_sold_quantity + :sold,
        last_sold_at = :last
    WHERE id = :id
"""), {
    "qty": new_qty,
    "sold": qty,
    "last": day,
    "id": p["id"]
})

                    

                # =====================================
                # UPDATE SALE TOTALS
                # =====================================
                conn.execute(text("""
                    UPDATE sales
                    SET
                        total_amount = :total,
                        total_profit = :profit,
                        updated_at = :now
                    WHERE id = :id
                """), {
                    "total": total,
                    "profit": profit,
                    "id": sale_id,
                    "now": day
                })

    print("✅ FULL AI-ready dataset generated")


# =========================================
# RUN EVERYTHING
# =========================================
if __name__ == "__main__":

    reset_data()

    seed_categories()

    seed_products()

    seed_sales(60)

    print("🚀 Demo AI inventory dataset ready")