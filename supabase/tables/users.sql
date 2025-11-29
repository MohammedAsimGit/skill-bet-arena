-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  phone_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_email_verified BOOLEAN DEFAULT FALSE,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  win_rate INTEGER DEFAULT 0,
  referral_code TEXT,
  referred_by TEXT,
  subscription_type TEXT DEFAULT 'free',
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  device_fingerprint TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT
);