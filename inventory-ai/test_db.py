import os
from dotenv import load_dotenv
from app.db import Database

load_dotenv()

db = Database(os.getenv("DATABASE_URL"))
from app.db import Database



df = db.get_sales_history_cached(16)

print(df.head(20))
print(df["y"].sum())