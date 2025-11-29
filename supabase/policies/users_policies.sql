-- RLS Policies for Users table

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own data (for initial creation)
CREATE POLICY "Users can insert own data" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Admins can read all user data
CREATE POLICY "Admins can read all user data" 
ON users FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));

-- Admins can update all user data
CREATE POLICY "Admins can update all user data" 
ON users FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));