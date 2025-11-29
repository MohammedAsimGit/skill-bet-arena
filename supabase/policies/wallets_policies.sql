-- RLS Policies for Wallets table

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can read own wallet" 
ON wallets FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update own wallet" 
ON wallets FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can read all wallets
CREATE POLICY "Admins can read all wallets" 
ON wallets FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));

-- Admins can update all wallets
CREATE POLICY "Admins can update all wallets" 
ON wallets FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));