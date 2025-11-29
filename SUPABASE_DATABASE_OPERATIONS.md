# Supabase Database Operations Guide

This guide details how to replace Firebase Firestore operations with Supabase PostgreSQL queries in the SkillBet Arena application.

## Overview

Supabase provides a PostgreSQL database with a JavaScript client library that offers similar functionality to Firebase Firestore but with the power and flexibility of SQL.

## Backend Implementation

### 1. Database Utilities

The `backend/utils/supabaseDb.js` file provides helper functions for common database operations:

```javascript
const { supabase } = require('./supabase');

// Generic database operations
async function insert(table, data) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }
}

async function select(table, filters = {}, options = {}) {
  try {
    let query = supabase.from(table).select(options.columns || '*');

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (Array.isArray(filters[key])) {
        query = query.in(key, filters[key]);
      } else {
        query = query.eq(key, filters[key]);
      }
    });

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.ascending !== false 
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Select failed: ${error.message}`);
  }
}

async function update(table, filters, data) {
  try {
    let query = supabase.from(table).update(data);

    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });

    const { data: result, error } = await query.select().single();

    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    throw new Error(`Update failed: ${error.message}`);
  }
}

async function remove(table, filters) {
  try {
    let query = supabase.from(table);

    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });

    const { data, error } = await query.delete();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
```

### 2. Firebase to Supabase Mapping

#### Document Creation (Firestore → Supabase)

**Firebase Firestore:**
```javascript
await db.collection('users').doc(userId).set(userData);
```

**Supabase PostgreSQL:**
```javascript
await insert('users', userData);
```

#### Document Retrieval (Firestore → Supabase)

**Firebase Firestore:**
```javascript
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();
```

**Supabase PostgreSQL:**
```javascript
const users = await select('users', { id: userId }, { limit: 1 });
const userData = users[0];
```

#### Document Update (Firestore → Supabase)

**Firebase Firestore:**
```javascript
await db.collection('users').doc(userId).update(updateData);
```

**Supabase PostgreSQL:**
```javascript
await update('users', { id: userId }, updateData);
```

#### Document Deletion (Firestore → Supabase)

**Firebase Firestore:**
```javascript
await db.collection('users').doc(userId).delete();
```

**Supabase PostgreSQL:**
```javascript
await remove('users', { id: userId });
```

#### Querying Collections (Firestore → Supabase)

**Firebase Firestore:**
```javascript
const snapshot = await db.collection('contests')
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

const contests = [];
snapshot.forEach(doc => {
  contests.push(doc.data());
});
```

**Supabase PostgreSQL:**
```javascript
const contests = await select('contests', 
  { status: 'active' }, 
  { orderBy: 'created_at', limit: 10 }
);
```

#### Complex Queries (Firestore → Supabase)

**Firebase Firestore:**
```javascript
const snapshot = await db.collection('results')
  .where('contestId', '==', contestId)
  .orderBy('score', 'desc')
  .orderBy('timeTaken', 'asc')
  .limit(100)
  .get();
```

**Supabase PostgreSQL:**
```javascript
const results = await supabase
  .from('results')
  .select(`
    *,
    users(display_name, photo_url)
  `)
  .eq('contest_id', contestId)
  .order('score', { ascending: false })
  .order('time_taken', { ascending: true })
  .limit(100);
```

### 3. Controller Updates

#### Wallet Controller Example

**Before (Firebase):**
```javascript
// Get user wallet
const walletDoc = await db.collection('wallets').doc(userId).get();

if (!walletDoc.exists) {
  // Create new wallet
  const wallet = new Wallet({ userId });
  await db.collection('wallets').doc(userId).set(wallet.toObject());
  return res.status(200).json({ wallet: wallet.toObject() });
}

const wallet = Wallet.fromDocument(walletDoc);
res.status(200).json({ wallet: wallet.toObject() });
```

**After (Supabase):**
```javascript
// Get user wallet
let walletData = await getWallet(userId);

if (!walletData) {
  // Create new wallet
  const wallet = new Wallet({ userId });
  const walletRecord = await insert('wallets', wallet.toObject());
  return res.status(200).json({ wallet: walletRecord });
}

res.status(200).json({ wallet: walletData });
```

#### Contest Controller Example

**Before (Firebase):**
```javascript
// Get all contests
let query = db.collection('contests');

// Apply filters
if (status) {
  query = query.where('status', '==', status);
}

if (gameType) {
  query = query.where('gameType', '==', gameType);
}

// Order by start time
query = query.orderBy('startTime', 'asc');

const snapshot = await query.get();

const contests = [];
snapshot.forEach(doc => {
  const contest = Contest.fromDocument(doc);
  contests.push(contest.toObject());
});
```

**After (Supabase):**
```javascript
// Get all contests
// Build filters
const filters = {};
if (status) filters.status = status;
if (gameType) filters.game_type = gameType;

const contestData = await getContests(filters);

const contests = contestData.map(contest => {
  const contestModel = new Contest({
    contestId: contest.id,
    ...contest
  });
  return contestModel.toObject();
});
```

## Frontend Implementation

### 1. Database Functions

The `frontend/assets/js/database.js` file provides frontend database functions:

```javascript
// Database functions using Supabase
import { supabase } from './supabase.js';

// Get user profile
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

// Get user wallet
async function getWallet(userId) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to get wallet: ${error.message}`);
  }
}
```

### 2. Dashboard Integration

**Before (Firebase/API):**
```javascript
// Fetch user profile
const userProfile = await SkillBetArena.apiCall('/auth/profile', 'GET');

// Fetch wallet data
const walletData = await SkillBetArena.getWallet();
```

**After (Supabase):**
```javascript
// Fetch user profile
const currentUser = await supabase.auth.getUser();
const userProfile = await getUserProfile(currentUser.data.user.id);

// Fetch wallet data
const walletData = await getWallet(currentUser.data.user.id);
```

## Data Model Mapping

### Users Collection → Users Table

**Firestore Document:**
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "phoneNumber": "+1234567890",
  "photoURL": "https://example.com/photo.jpg",
  "createdAt": "2023-01-01T00:00:00Z",
  "lastLoginAt": "2023-01-01T00:00:00Z",
  "isEmailVerified": true,
  "walletBalance": 100.50,
  "totalEarnings": 500.00,
  "gamesPlayed": 25,
  "gamesWon": 15,
  "winRate": 60,
  "referralCode": "ABC123",
  "referredBy": "XYZ789",
  "subscriptionType": "gold",
  "subscriptionExpiry": "2024-01-01T00:00:00Z",
  "deviceFingerprint": "fingerprint123",
  "isBanned": false
}
```

**PostgreSQL Table Row:**
```sql
INSERT INTO users (
  id,
  email,
  display_name,
  phone_number,
  photo_url,
  created_at,
  last_login_at,
  is_email_verified,
  wallet_balance,
  total_earnings,
  games_played,
  games_won,
  win_rate,
  referral_code,
  referred_by,
  subscription_type,
  subscription_expiry,
  device_fingerprint,
  is_banned
) VALUES (
  'user123',
  'user@example.com',
  'John Doe',
  '+1234567890',
  'https://example.com/photo.jpg',
  '2023-01-01T00:00:00Z',
  '2023-01-01T00:00:00Z',
  true,
  100.50,
  500.00,
  25,
  15,
  60,
  'ABC123',
  'XYZ789',
  'gold',
  '2024-01-01T00:00:00Z',
  'fingerprint123',
  false
);
```

### Contests Collection → Contests Table

**Firestore Document:**
```json
{
  "contestId": "contest123",
  "title": "Weekly Coding Challenge",
  "description": "Test your coding skills",
  "gameType": "coding",
  "entryFee": 10.00,
  "prizePool": 100.00,
  "platformCommission": 10.00,
  "maxPlayers": 50,
  "startTime": "2023-01-01T10:00:00Z",
  "duration": 60,
  "createdBy": "admin123",
  "difficulty": "intermediate",
  "isPrivate": false,
  "accessCode": "",
  "status": "upcoming",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

**PostgreSQL Table Row:**
```sql
INSERT INTO contests (
  id,
  title,
  description,
  game_type,
  entry_fee,
  prize_pool,
  platform_commission,
  max_players,
  start_time,
  duration,
  created_by,
  difficulty,
  is_private,
  access_code,
  status,
  created_at,
  updated_at
) VALUES (
  'contest123',
  'Weekly Coding Challenge',
  'Test your coding skills',
  'coding',
  10.00,
  100.00,
  10.00,
  50,
  '2023-01-01T10:00:00Z',
  60,
  'admin123',
  'intermediate',
  false,
  '',
  'upcoming',
  '2023-01-01T00:00:00Z',
  '2023-01-01T00:00:00Z'
);
```

## Performance Optimization

### Indexing

Create indexes for frequently queried columns:

```sql
-- Index on commonly queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_game_type ON contests(game_type);
CREATE INDEX idx_results_contest_id ON results(contest_id);
CREATE INDEX idx_results_score ON results(score);
```

### Query Optimization

Use specific column selection instead of `SELECT *` when possible:

```javascript
// Instead of selecting all columns
const { data } = await supabase.from('users').select('*');

// Select only needed columns
const { data } = await supabase.from('users').select('id, email, display_name');
```

### Pagination

Implement pagination for large datasets:

```javascript
// Get paginated results
const { data, error } = await supabase
  .from('contests')
  .select('*')
  .range(0, 9); // First 10 records
```

## Error Handling

### Common Errors

1. **Permission Denied**: Check RLS policies
2. **Record Not Found**: Handle empty result sets
3. **Constraint Violations**: Validate data before insertion
4. **Connection Errors**: Implement retry logic

### Error Handling Patterns

```javascript
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // Handle specific error types
      if (error.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    // Log error for debugging
    console.error('Get user profile error:', error);
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}
```

## Testing

### Unit Tests

```javascript
// Test user creation
test('should create a new user', async () => {
  const userData = {
    id: 'test123',
    email: 'test@example.com',
    display_name: 'Test User'
  };
  
  const result = await insert('users', userData);
  expect(result.id).toBe(userData.id);
  expect(result.email).toBe(userData.email);
});

// Test user retrieval
test('should retrieve existing user', async () => {
  const users = await select('users', { id: 'test123' });
  expect(users.length).toBe(1);
  expect(users[0].email).toBe('test@example.com');
});
```

### Integration Tests

```javascript
// Test complete user flow
test('should handle complete user registration flow', async () => {
  // 1. Register user with auth
  const authResult = await supabase.auth.signUp({
    email: 'integration@test.com',
    password: 'Test1234!'
  });
  
  // 2. Create user record
  const userData = {
    id: authResult.user.id,
    email: authResult.user.email,
    display_name: 'Integration Test User'
  };
  
  const userRecord = await insert('users', userData);
  
  // 3. Retrieve user
  const retrievedUsers = await select('users', { id: userRecord.id });
  
  expect(retrievedUsers.length).toBe(1);
  expect(retrievedUsers[0].email).toBe('integration@test.com');
});
```

## Migration Strategy

### 1. Data Migration

Export data from Firestore and import to PostgreSQL:

```javascript
// Example migration script
async function migrateUsers() {
  // Get all users from Firestore
  const snapshot = await db.collection('users').get();
  
  // Convert and insert to Supabase
  const batch = [];
  snapshot.forEach(doc => {
    const userData = doc.data();
    batch.push({
      id: doc.id,
      email: userData.email,
      display_name: userData.displayName,
      // ... map other fields
    });
  });
  
  // Insert batch to Supabase
  const { data, error } = await supabase
    .from('users')
    .insert(batch);
}
```

### 2. Gradual Migration

1. Set up Supabase alongside Firebase
2. Redirect new operations to Supabase
3. Migrate existing data in batches
4. Remove Firebase dependencies

### 3. Dual Write Pattern

During transition period, write to both databases:

```javascript
async function createUser(userData) {
  // Write to Firebase (legacy)
  await db.collection('users').doc(userData.id).set(userData);
  
  // Write to Supabase (new)
  await insert('users', userData);
}
```

## Best Practices

1. **Use connection pooling** for better performance
2. **Implement proper error handling** with meaningful messages
3. **Use prepared statements** to prevent SQL injection
4. **Index frequently queried columns** for better performance
5. **Implement caching** for frequently accessed data
6. **Use transactions** for atomic operations
7. **Monitor query performance** and optimize slow queries
8. **Backup data regularly** before major changes

## Support

For issues with Supabase database operations:
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)