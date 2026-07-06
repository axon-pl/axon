# Benchmark: Data pipeline — filter, transform, aggregate
from dataclasses import dataclass
from typing import List

@dataclass
class Order:
    customer: str
    product:  str
    qty:      int
    price:    float
    shipped:  bool

orders: List[Order] = [
    Order("Alice",   "Widget A", 3, 9.99,  True),
    Order("Bob",     "Widget B", 1, 24.99, False),
    Order("Charlie", "Widget A", 5, 9.99,  True),
    Order("Diana",   "Widget C", 2, 49.99, True),
    Order("Eve",     "Widget B", 4, 24.99, True),
    Order("Frank",   "Widget A", 1, 9.99,  False),
    Order("Grace",   "Widget C", 3, 49.99, True),
]

revenue = sum(o.qty * o.price for o in orders if o.shipped)

top_customers = [
    o.customer
    for o in sorted(
        filter(lambda o: o.shipped, orders),
        key=lambda o: o.qty * o.price,
        reverse=True
    )
][:3]

print(f"Revenue: ${revenue}")
print(f"Top customers: {', '.join(top_customers)}")
