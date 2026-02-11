CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED','PENDING','PAID','FAILED','CANCELED')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  payment_url TEXT,
  external_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
