-- RLS Policies for Contests table

-- Enable RLS
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Everyone can read public contests
CREATE POLICY "Everyone can read public contests" 
ON contests FOR SELECT 
USING (is_private = false);

-- Users can read private contests they have access to
CREATE POLICY "Users can read accessible private contests" 
ON contests FOR SELECT 
USING (is_private = true AND access_code IS NOT NULL);

-- Authenticated users can create contests
CREATE POLICY "Authenticated users can create contests" 
ON contests FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Contest creators can update their own contests
CREATE POLICY "Contest creators can update their contests" 
ON contests FOR UPDATE 
USING (auth.uid() = created_by);

-- Admins can read all contests
CREATE POLICY "Admins can read all contests" 
ON contests FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));

-- Admins can update all contests
CREATE POLICY "Admins can update all contests" 
ON contests FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));