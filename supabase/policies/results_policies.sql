-- RLS Policies for Results table

-- Enable RLS
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Users can read their own results
CREATE POLICY "Users can read own results" 
ON results FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert own results" 
ON results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Everyone can read results for public contests
CREATE POLICY "Everyone can read public contest results" 
ON results FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM contests c 
  WHERE c.id = results.contest_id 
  AND c.is_private = false
));

-- Admins can read all results
CREATE POLICY "Admins can read all results" 
ON results FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));