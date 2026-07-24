import logging
import random
import time

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db import orders, products
from app.deps import get_current_user

logger = logging.getLogger("app.checkout")

router = APIRouter(prefix="/api/checkout", tags=["orders"])

# Demo-only: simulate a flaky payment processor so the checkout call has real
# latency/error variance for the RUM-APM trace-correlation demo beat.
SIMULATED_LATENCY_SECONDS = 1.5
SIMULATED_FAILURE_RATE = 0.5


class CartItem(BaseModel):
    productId: str
    quantity: int


class CheckoutRequest(BaseModel):
    items: list[CartItem]


@router.post("")
def checkout(body: CheckoutRequest, user: dict = Depends(get_current_user)):
    if not body.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    resolved_items = []
    total = 0.0

    for item in body.items:
        try:
            oid = ObjectId(item.productId)
        except InvalidId:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid product id {item.productId}")

        product = products.find_one({"_id": oid})
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item.productId} not found")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Insufficient stock for {product['name']}")

        line_total = product["price"] * item.quantity
        total += line_total
        resolved_items.append({"productId": oid, "name": product["name"], "quantity": item.quantity, "price": product["price"]})

    # Simulate a payment processor round-trip.
    time.sleep(SIMULATED_LATENCY_SECONDS)
    if random.random() < SIMULATED_FAILURE_RATE:
        logger.warning("checkout failed: payment processor timeout (user=%s, total=%.2f)", user["_id"], total)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment processor timeout — please try again")

    for item in resolved_items:
        products.update_one({"_id": item["productId"]}, {"$inc": {"stock": -item["quantity"]}})

    order = {
        "userId": user["_id"],
        "items": [{**i, "productId": str(i["productId"])} for i in resolved_items],
        "total": round(total, 2),
    }
    result = orders.insert_one(order)
    logger.info("checkout succeeded: order=%s user=%s total=%.2f", result.inserted_id, user["_id"], total)

    return {"orderId": str(result.inserted_id), "total": order["total"], "items": order["items"]}
