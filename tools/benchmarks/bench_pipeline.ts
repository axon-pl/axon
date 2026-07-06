// Benchmark: Data pipeline — filter, transform, aggregate
interface Order {
  customer: string;
  product:  string;
  qty:      number;
  price:    number;
  shipped:  boolean;
}

const orders: Order[] = [
  { customer: "Alice",   product: "Widget A", qty: 3, price: 9.99,  shipped: true  },
  { customer: "Bob",     product: "Widget B", qty: 1, price: 24.99, shipped: false },
  { customer: "Charlie", product: "Widget A", qty: 5, price: 9.99,  shipped: true  },
  { customer: "Diana",   product: "Widget C", qty: 2, price: 49.99, shipped: true  },
  { customer: "Eve",     product: "Widget B", qty: 4, price: 24.99, shipped: true  },
  { customer: "Frank",   product: "Widget A", qty: 1, price: 9.99,  shipped: false },
  { customer: "Grace",   product: "Widget C", qty: 3, price: 49.99, shipped: true  },
];

const revenue = orders
  .filter(o => o.shipped)
  .map(o => o.qty * o.price)
  .reduce((sum, v) => sum + v, 0);

const topCustomers = orders
  .filter(o => o.shipped)
  .sort((a, b) => (b.qty * b.price) - (a.qty * a.price))
  .map(o => o.customer)
  .slice(0, 3);

console.log(`Revenue: $${revenue}`);
console.log(`Top customers: ${topCustomers.join(", ")}`);
