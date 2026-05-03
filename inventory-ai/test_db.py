from app.db import Database

db = Database("")

print(db.get_product_by_id(1))
