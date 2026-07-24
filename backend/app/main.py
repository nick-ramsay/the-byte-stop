from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logging_config import configure_logging
from app.routers import auth_routes, order_routes, product_routes
from app.seed import seed_products

configure_logging()

app = FastAPI(title="The Byte Stop")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(order_routes.router)


@app.on_event("startup")
def on_startup():
    seed_products()


@app.get("/api/health")
def health():
    return {"status": "ok"}
