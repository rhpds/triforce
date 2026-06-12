"""Synthetic financial services data generator.

Produces realistic (but fully synthetic) financial transactions for scale testing.
No real PII, account numbers, or financial data is used.
"""

import json
import random
import uuid
from datetime import datetime, timedelta, timezone


TRANSACTION_TYPES = ["wire", "ach", "card", "crypto", "internal"]
CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF"]
COUNTRIES = ["US", "GB", "DE", "JP", "CA", "FR", "AU", "SG", "HK", "BR"]

BUSINESS_NAMES = [
    "Acme Corp", "Global Trading LLC", "TechVentures Inc", "Pacific Imports",
    "Mountain View Solutions", "Riverside Holdings", "Beacon Financial",
    "Nexus Logistics", "Prairie Industries", "Coastal Dynamics",
]

PERSON_NAMES = [
    "Alice Johnson", "Bob Chen", "Carol Williams", "David Patel",
    "Emma Rodriguez", "Frank Kim", "Grace Thompson", "Henry Nguyen",
    "Iris Martinez", "Jack O'Brien",
]

SUSPICIOUS_PATTERNS = {
    "high_amount": lambda: random.uniform(50000, 500000),
    "round_amount": lambda: random.choice([10000, 25000, 50000, 100000]),
    "rapid_succession": lambda: random.uniform(1000, 5000),
    "cross_border_high": lambda: random.uniform(20000, 100000),
    "micro_transactions": lambda: random.uniform(0.01, 1.00),
}


def generate_transaction(suspicious: bool = False) -> dict:
    tx_type = random.choice(TRANSACTION_TYPES)

    if suspicious:
        pattern = random.choice(list(SUSPICIOUS_PATTERNS.keys()))
        amount = SUSPICIOUS_PATTERNS[pattern]()
    else:
        if tx_type == "card":
            amount = round(random.uniform(5, 500), 2)
        elif tx_type == "ach":
            amount = round(random.uniform(100, 10000), 2)
        elif tx_type == "wire":
            amount = round(random.uniform(1000, 50000), 2)
        elif tx_type == "crypto":
            amount = round(random.uniform(50, 25000), 2)
        else:
            amount = round(random.uniform(100, 5000), 2)

    sender_is_business = random.random() > 0.6
    receiver_is_business = random.random() > 0.5

    sender_country = random.choice(COUNTRIES)
    receiver_country = sender_country if random.random() > 0.3 else random.choice(COUNTRIES)

    return {
        "id": str(uuid.uuid4()),
        "amount": round(amount, 2),
        "currency": random.choice(CURRENCIES),
        "sender": {
            "id": f"cust-{random.randint(1000, 9999)}",
            "name": random.choice(BUSINESS_NAMES if sender_is_business else PERSON_NAMES),
            "country": sender_country,
            "account_type": "business" if sender_is_business else "individual",
        },
        "receiver": {
            "id": f"cust-{random.randint(1000, 9999)}",
            "name": random.choice(BUSINESS_NAMES if receiver_is_business else PERSON_NAMES),
            "country": receiver_country,
            "account_type": "business" if receiver_is_business else "individual",
        },
        "timestamp": (datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, 86400))).isoformat(),
        "type": tx_type,
        "metadata": {},
    }


def generate_batch(count: int, suspicious_ratio: float = 0.05) -> list[dict]:
    transactions = []
    for _ in range(count):
        is_suspicious = random.random() < suspicious_ratio
        transactions.append(generate_transaction(suspicious=is_suspicious))
    return transactions


def generate_velocity_burst(customer_id: str, count: int = 10) -> list[dict]:
    """Generate a burst of transactions from one customer (velocity pattern)."""
    base_time = datetime.now(timezone.utc)
    transactions = []
    for i in range(count):
        tx = generate_transaction()
        tx["sender"]["id"] = customer_id
        tx["timestamp"] = (base_time + timedelta(seconds=i * 30)).isoformat()
        tx["amount"] = round(random.uniform(500, 3000), 2)
        transactions.append(tx)
    return transactions


if __name__ == "__main__":
    batch = generate_batch(10, suspicious_ratio=0.3)
    for tx in batch:
        flag = "SUSPICIOUS" if tx["amount"] > 10000 else "normal"
        print(f"[{tx['type']:8s}] {tx['sender']['name']:25s} → {tx['receiver']['name']:25s}  "
              f"${tx['amount']:>10,.2f} {tx['currency']} ({flag})")
