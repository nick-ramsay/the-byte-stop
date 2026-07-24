from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, status

from app.db import products

router = APIRouter(prefix="/api/products", tags=["products"])


def _serialize(product: dict) -> dict:
    product = dict(product)
    product["id"] = str(product.pop("_id"))
    return product


@router.get("")
def list_products(category: str | None = None):
    query = {"category": category} if category else {}
    return [_serialize(p) for p in products.find(query)]


@router.get("/{product_id}")
def get_product(product_id: str):
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product = products.find_one({"_id": oid})
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _serialize(product)
