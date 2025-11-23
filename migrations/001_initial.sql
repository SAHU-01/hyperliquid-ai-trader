-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  main_wallet TEXT NOT NULL UNIQUE,
  hl_api_address TEXT NOT NULL,
  hl_api_secret_key TEXT NOT NULL,
  risk_level TEXT DEFAULT 'balanced',
  max_position_size REAL DEFAULT 0.3,
  enable_auto_trade INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  coin TEXT NOT NULL,
  action TEXT NOT NULL,
  side TEXT NOT NULL,
  entry_price REAL,
  exit_price REAL,
  tp_price REAL,
  sl_price REAL,
  size REAL,
  confidence REAL,
  pnl REAL,
  status TEXT DEFAULT 'OPEN',
  timestamp INTEGER,
  closed_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Monthly performance
CREATE TABLE IF NOT EXISTS monthly_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_pnl REAL DEFAULT 0,
  return_pct REAL DEFAULT 0,
  UNIQUE(user_id, month),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Signals log
CREATE TABLE IF NOT EXISTS signals_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin TEXT NOT NULL,
  signal TEXT NOT NULL,
  confidence REAL,
  news_score REAL,
  orderbook_score REAL,
  technical_score REAL,
  timestamp INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals_log(timestamp);
