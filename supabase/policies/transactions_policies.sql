-- RLS Policies for Transactions table

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can read all transactions
CREATE POLICY "Admins can read all transactions" 
ON transactions FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));