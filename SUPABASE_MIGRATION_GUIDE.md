# Supabase Migration Guide

This guide documents the migration of SkillBet Arena from Firebase to Supabase.

## Overview

This migration replaces all Firebase services with Supabase equivalents:
- Firebase Authentication → Supabase Auth
- Firestore Database → Supabase PostgreSQL
- Firebase Storage → Supabase Storage
- Firebase Real-time Listeners → Supabase Real-time

## Prerequisites

1. Create a Supabase account at https://supabase.com/
2. Create a new Supabase project
3. Note your Supabase URL and API keys from the project dashboard

## Configuration

### Backend Configuration

1. Update your `.env` file with Supabase credentials:
```
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

**To get your Supabase credentials:**
- Go to your Supabase project dashboard
- Click on "Project Settings" → "API"
- Copy the "Project URL" to `SUPABASE_URL`
- Copy the "anon" public key to `SUPABASE_ANON_KEY`
- Copy the "service_role" secret key to `SUPABASE_SERVICE_ROLE_KEY`

2. Install Supabase dependencies:
```bash
npm install @supabase/supabase-js
npm uninstall firebase-admin
```

### Frontend Configuration

1. Update `frontend/assets/js/supabase.js` with your Supabase credentials:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'your-actual-anon-key-here'; // Replace with your Supabase anon key
```

**To get your Supabase credentials:**
- Go to your Supabase project dashboard
- Click on "Project Settings" → "API"
- Copy the "Project URL" to `SUPABASE_URL`
- Copy the "anon" public key to `SUPABASE_ANON_KEY`

## Database Schema Migration

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  phone_number TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP DEFAULT NOW(),
  is_email_verified BOOLEAN DEFAULT FALSE,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  win_rate INTEGER DEFAULT 0,
  referral_code TEXT,
  referred_by TEXT,
  subscription_type TEXT DEFAULT 'free',
  subscription_expiry TIMESTAMP,
  device_fingerprint TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMP,
  ban_reason TEXT
);
```

### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  balance DECIMAL(10,2) DEFAULT 0,
  total_deposits DECIMAL(10,2) DEFAULT 0,
  total_withdrawals DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Contests Table
```sql
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  prize_pool DECIMAL(10,2) DEFAULT 0,
  platform_commission DECIMAL(10,2) DEFAULT 0,
  max_players INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration INTEGER, -- in minutes
  created_by UUID REFERENCES users(id),
  difficulty TEXT DEFAULT 'beginner',
  is_private BOOLEAN DEFAULT FALSE,
  access_code TEXT,
  status TEXT DEFAULT 'upcoming', -- upcoming, ongoing, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- deposit, withdrawal, contest_entry, winnings
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  description TEXT,
  reference_id TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Results Table
```sql
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  contest_id UUID REFERENCES contests(id),
  game_id TEXT,
  score INTEGER,
  time_taken INTEGER, -- in milliseconds
  answers JSONB,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

### Storage Buckets

Create storage buckets for:
- `avatars` - User profile pictures
- `game-assets` - Game-related assets

## Authentication Setup

1. Enable Email/Password authentication in Supabase Dashboard
2. Configure RLS (Row Level Security) policies:
```sql
-- Users can only read and update their own data
CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid() = id);
```

## Real-time Features

Supabase provides real-time capabilities through PostgreSQL changes:

```javascript
// Listen for contest updates
const contestChannel = supabase
  .channel('contest-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'contests'
    },
    (payload) => {
      console.log('Contest updated:', payload.new);
    }
  )
  .subscribe();
```

## API Changes

All existing API endpoints remain the same. The backend controllers have been updated to use Supabase instead of Firebase, but the API contract is preserved.

## Testing

1. Run the backend server:
```bash
npm run dev
```

2. Serve the frontend:
```bash
npx serve -s frontend
```

3. Test authentication flows
4. Test game functionality
5. Test wallet operations
6. Test leaderboard features

## Troubleshooting

### Common Issues

1. **Authentication errors**: Ensure your Supabase URL and keys are correct
2. **Database connection errors**: Check your Supabase project status
3. **RLS policy violations**: Verify your Row Level Security policies
4. **Storage access denied**: Check bucket permissions

### Debugging Tips

1. Enable Supabase logs in the dashboard
2. Use Supabase SQL editor to test queries
3. Check browser console for frontend errors
4. Verify environment variables are correctly set

## Rollback Plan

If you need to rollback to Firebase:

1. Restore the original Firebase configuration files
2. Reinstall Firebase dependencies
3. Restore the original controller files
4. Update environment variables to Firebase settings

## Support

For issues with this migration, contact the development team or refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)