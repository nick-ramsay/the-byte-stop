from app.db import products

ELECTRONICS = [
    {
        "name": "Wireless Over-Ear Headphones",
        "category": "Audio",
        "price": 129.99,
        "description": "Active noise-cancelling wireless headphones with 30-hour battery life.",
        "imageUrl": "/images/headphones.jpg",
        "stock": 25,
    },
    {
        "name": "27-inch 4K Monitor",
        "category": "Monitors",
        "price": 349.99,
        "description": "27-inch 4K IPS monitor with HDR support and USB-C connectivity.",
        "imageUrl": "/images/monitor.png",
        "stock": 15,
    },
    {
        "name": "Mechanical Keyboard",
        "category": "Accessories",
        "price": 89.99,
        "description": "Hot-swappable mechanical keyboard with RGB backlighting.",
        "imageUrl": "/images/keyboard.jpg",
        "stock": 40,
    },
    {
        "name": "UltraBook 14 Laptop",
        "category": "Laptops",
        "price": 1199.00,
        "description": "14-inch ultrabook, 16GB RAM, 512GB SSD, all-day battery life.",
        "imageUrl": "/images/laptop.jpg",
        "stock": 10,
    },
    {
        "name": "Nova Smartphone X",
        "category": "Phones",
        "price": 799.00,
        "description": "6.5-inch OLED display, triple-camera system, 5G connectivity.",
        "imageUrl": "/images/smartphone.jpg",
        "stock": 20,
    },
    {
        "name": "FitTrack Smartwatch",
        "category": "Wearables",
        "price": 199.99,
        "description": "Fitness tracking smartwatch with heart-rate and sleep monitoring.",
        "imageUrl": "/images/smartwatch.jpg",
        "stock": 30,
    },
    {
        "name": "1080p Webcam",
        "category": "Accessories",
        "price": 59.99,
        "description": "Full HD webcam with auto-focus and built-in noise-cancelling mic.",
        "imageUrl": "/images/webcam.jpg",
        "stock": 35,
    },
    {
        "name": "1TB Portable SSD",
        "category": "Storage",
        "price": 109.99,
        "description": "Compact 1TB external SSD with USB-C, up to 1050MB/s transfer speed.",
        "imageUrl": "/images/ssd.jpg",
        "stock": 50,
    },
    {
        "name": "Wi-Fi 6 Router",
        "category": "Networking",
        "price": 149.99,
        "description": "Dual-band Wi-Fi 6 router supporting speeds up to 3000Mbps.",
        "imageUrl": "/images/router.jpg",
        "stock": 18,
    },
    {
        "name": "Wireless Gaming Mouse",
        "category": "Accessories",
        "price": 69.99,
        "description": "Lightweight wireless gaming mouse with 16000 DPI optical sensor.",
        "imageUrl": "/images/mouse.jpg",
        "stock": 45,
    },
    {
        "name": "Portable Bluetooth Speaker",
        "category": "Audio",
        "price": 79.99,
        "description": "Waterproof portable speaker with 12-hour battery and deep bass.",
        "imageUrl": "/images/speaker.jpg",
        "stock": 28,
    },
    {
        "name": "Legacy USB-C Hub (Clearance)",
        "category": "Accessories",
        "price": 24.99,
        # Left over from an old catalog migration that dropped this field for
        # discontinued SKUs — the API still returns 200 with valid JSON.
        "description": None,
        "imageUrl": "/images/usb-hub.jpg",
        "stock": 6,
    },
]


def seed_products() -> None:
    if products.count_documents({}) > 0:
        return
    products.insert_many(ELECTRONICS)
