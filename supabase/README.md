# Supabase Setup

This directory contains all the SQL scripts needed to set up your Supabase database for the SkillBet Arena application.

## Directory Structure

- `tables/` - Table creation scripts
- `policies/` - Row Level Security policies
- `storage/` - Storage bucket setup

## Setup Instructions

1. **Create Tables**: Run all SQL scripts in the `tables/` directory
2. **Set up Storage**: Run the script in `storage/setup.sql`
3. **Apply RLS Policies**: Run all SQL scripts in the `policies/` directory

## Table Descriptions

### Users
Stores user account information including authentication details, profile data, and game statistics.

### Wallets
Manages user wallet balances and transaction history.

### Contests
Stores information about gaming contests including entry fees, prize pools, and scheduling.

### Transactions
Tracks all financial transactions including deposits, withdrawals, and contest entries.

### Results
Stores game results for all users across all contests.

### Referrals
Tracks referral relationships between users.

### Leaderboards
Caches leaderboard data for faster retrieval.

### Challenges
Stores coding challenges for the coding game.

### Suspicious Activities
Logs potential cheating or suspicious behavior for review.

## Security

All tables have Row Level Security (RLS) policies applied to ensure data privacy and security:
- Users can only access their own data
- Admins have broader access for management purposes
- Public read access is limited to non-sensitive data

## Storage Buckets

### Avatars
Public bucket for user profile pictures with user-level access control.

### Game Assets
Public bucket for game-related assets with admin-only write access.