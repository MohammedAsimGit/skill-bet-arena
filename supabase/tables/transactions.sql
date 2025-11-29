-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- deposit, withdrawal, contest_entry, winnings
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  description TEXT,
  reference_id TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);