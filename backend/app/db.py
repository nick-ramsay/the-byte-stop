import os

from pymongo import MongoClient

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/bytestop")

_client = MongoClient(MONGODB_URI)
db = _client.get_default_database()

users = db["users"]
products = db["products"]
orders = db["orders"]

users.create_index("email", unique=True)
