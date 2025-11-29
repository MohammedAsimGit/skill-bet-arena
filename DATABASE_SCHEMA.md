# SkillBet Arena Database Schema

This document describes the database schema for the SkillBet Arena platform using Supabase PostgreSQL.

## 📁 Collections Overview

```
skillbet-arena/
├── users/
├── wallets/
├── transactions/
├── contests/
├── results/
├── leaderboards/
├── referrals/
├── admins/
└── games/
```

## 🧑 Users Collection

### Document Structure
```javascript
{
  id: string,                     // User's unique ID (matches Supabase Auth UID)
  email: string,                  // User's email address
  displayName: string,            // User's display name
  phoneNumber: string,            // User's phone number (optional)
  photoURL: string,               // URL to user's profile picture
  createdAt: timestamp,           // Account creation date
  lastLoginAt: timestamp,         // Last login date
  isEmailVerified: boolean,       // Whether email is verified
  disabled: boolean,              // Whether account is disabled
  walletBalance: number,          // Current wallet balance
  totalEarnings: number,          // Total earnings from contests
  gamesPlayed: number,            // Total games played
  gamesWon: number,               // Total games won
  winRate: number,                // Win rate percentage
  referralCode: string,           // User's referral code
  referredBy: string,             // Referral code of referrer
  subscriptionType: string,       // free, gold, elite
  subscriptionExpiry: timestamp,  // Subscription expiry date
  deviceFingerprint: string,      // Device fingerprint for anti-cheat
  isBanned: boolean               // Whether user is banned
}
```

### Indexes
- `uid` (Primary key)
- `email` (Unique)
- `referralCode` (Unique)
- `createdAt` (For sorting)
- `gamesPlayed` (For leaderboards)
- `totalEarnings` (For leaderboards)

## 💰 Wallets Collection

### Document Structure
```javascript
{
  userId: string,                 // Reference to user ID
  balance: number,                // Current balance
  totalDeposits: number,          // Total deposits made
  totalWithdrawals: number,       // Total withdrawals made
  totalEarnings: number,          // Total earnings from contests
  totalSpent: number,             // Total spent on contests
  currency: string,               // Currency code (default: INR)
  createdAt: timestamp,           // Wallet creation date
  updatedAt: timestamp            // Last update date
}
```

### Indexes
- `userId` (Primary key)
- `balance` (For sorting)
- `updatedAt` (For recent activity)

## 🔄 Transactions Collection

### Document Structure
```javascript
{
  transactionId: string,          // Unique transaction ID
  userId: string,                 // Reference to user ID
  type: string,                   // deposit, withdrawal, contest_entry, contest_win, refund, bonus
  amount: number,                 // Transaction amount
  currency: string,               // Currency code (default: INR)
  status: string,                 // pending, completed, failed, cancelled
  paymentMethod: string,          // razorpay, wallet, upi, etc.
  description: string,            // Transaction description
  referenceId: string,            // Reference to contest, order, etc.
  createdAt: timestamp,           // Transaction creation date
  completedAt: timestamp,         // Completion date
  metadata: object                // Additional transaction data
}
```

### Metadata Examples
```javascript
// Deposit metadata
{
  razorpayOrderId: string,
  razorpayPaymentId: string
}

// Contest entry metadata
{
  contestId: string
}

// Withdrawal metadata
{
  bankDetails: object,
  status: string // pending_approval, approved, rejected
}
```

### Indexes
- `transactionId` (Primary key)
- `userId` (For user transactions)
- `type` (For filtering by type)
- `status` (For filtering by status)
- `createdAt` (For sorting)

## 🏆 Contests Collection

### Document Structure
```javascript
{
  contestId: string,              // Unique contest ID
  title: string,                  // Contest title
  description: string,            // Contest description
  gameType: string,               // coding, maths, memory, typing
  entryFee: number,               // Entry fee amount
  prizePool: number,              // Total prize pool
  platformCommission: number,     // Platform commission amount
  maxPlayers: number,             // Maximum players allowed
  currentPlayers: number,         // Current player count
  status: string,                 // upcoming, ongoing, completed, cancelled
  startTime: timestamp,           // Scheduled start time
  endTime: timestamp,             // Actual end time
  duration: number,               // Duration in minutes
  createdBy: string,              // Creator user ID
  createdAt: timestamp,           // Creation date
  updatedAt: timestamp,           // Last update date
  participants: array,            // Array of user IDs
  winners: array,                 // Array of winner objects
  questions: array,               // Questions for quiz/coding games
  difficulty: string,             // beginner, intermediate, expert
  isPrivate: boolean,             // Whether contest is private
  accessCode: string              // Access code for private contests
}
```

### Winner Object Structure
```javascript
{
  userId: string,
  rank: number,
  prize: number,
  score: number
}
```

### Question Object Structure (for quizzes/coding)
```javascript
{
  id: string,
  question: string,
  options: array,               // For multiple choice
  correctAnswer: string,
  category: string,
  difficulty: string,
  timeLimit: number             // Time limit for this question
}
```

### Indexes
- `contestId` (Primary key)
- `gameType` (For filtering by game)
- `status` (For filtering by status)
- `startTime` (For sorting)
- `createdBy` (For admin filtering)

## 📊 Results Collection

### Document Structure
```javascript
{
  resultId: string,               // Unique result ID
  userId: string,                 // Reference to user ID
  contestId: string,              // Reference to contest ID
  gameId: string,                 // Reference to game ID
  score: number,                  // User's score
  timeTaken: number,              // Time taken in seconds
  answers: object,                // User's answers
  submittedAt: timestamp,         // Submission time
  metadata: object                // Additional result data
}
```

### Answers Object Structure
```javascript
{
  questionId: string,
  answer: string,
  timeTaken: number,
  isCorrect: boolean
}
```

### Indexes
- `resultId` (Primary key)
- `userId` (For user results)
- `contestId` (For contest results)
- `gameId` (For game results)
- `submittedAt` (For sorting)
- `score` (For leaderboards)

## 🥇 Leaderboards Collection

### Document Structure
```javascript
{
  leaderboardId: string,          // Unique leaderboard ID
  contestId: string,              // Reference to contest (null for global)
  gameId: string,                 // Reference to game (null for overall)
  entries: array,                 // Array of leaderboard entries
  createdAt: timestamp,           // Creation date
  updatedAt: timestamp            // Last update date
}
```

### Leaderboard Entry Structure
```javascript
{
  userId: string,
  score: number,
  timeTaken: number,
  rank: number,
  submittedAt: timestamp
}
```

### Indexes
- `leaderboardId` (Primary key)
- `contestId` (For contest leaderboards)
- `gameId` (For game leaderboards)
- `updatedAt` (For recent leaderboards)

## 👥 Referrals Collection

### Document Structure
```javascript
{
  referralId: string,             // Unique referral ID
  referrerId: string,             // User ID of referrer
  referredId: string,             // User ID of referred user
  createdAt: timestamp,           // Referral creation date
  bonusAwarded: boolean,          // Whether bonus was awarded
  bonusAmount: number             // Bonus amount awarded
}
```

### Indexes
- `referralId` (Primary key)
- `referrerId` (For user referrals)
- `referredId` (To prevent duplicate referrals)
- `createdAt` (For sorting)

## 🔧 Admins Collection

### Document Structure
```javascript
{
  adminId: string,                // Unique admin ID
  userId: string,                 // Reference to user ID
  email: string,                  // Admin email
  role: string,                   // admin, moderator, support
  permissions: array,             // Array of permission strings
  createdAt: timestamp,           // Admin account creation date
  lastLoginAt: timestamp,         // Last login date
  isActive: boolean               // Whether admin account is active
}
```

### Permission Examples
```javascript
[
  "contests.create",
  "contests.edit",
  "contests.delete",
  "users.ban",
  "users.unban",
  "withdrawals.approve",
  "withdrawals.reject"
]
```

### Indexes
- `adminId` (Primary key)
- `userId` (Unique)
- `email` (Unique)
- `role` (For filtering by role)

## 🎮 Games Collection

### Document Structure
```javascript
{
  gameId: string,                 // Unique game ID
  title: string,                  // Game title
  description: string,            // Game description
  type: string,                   // coding, maths, memory, typing
  difficulty: string,             // beginner, intermediate, expert
  timeLimit: number,              // Time limit in seconds
  maxScore: number,               // Maximum possible score
  createdBy: string,              // Creator user ID
  createdAt: timestamp,           // Creation date
  updatedAt: timestamp,           // Last update date
  isActive: boolean,              // Whether game is active
  questions: array                // Game questions/challenges
}
```

### Indexes
- `gameId` (Primary key)
- `type` (For filtering by game type)
- `difficulty` (For filtering by difficulty)
- `isActive` (For active games)
- `createdAt` (For sorting)

## 🔗 Relationships

### User ↔ Wallet
- One-to-One relationship
- `wallets.userId` references `users.uid`

### User ↔ Transactions
- One-to-Many relationship
- `transactions.userId` references `users.uid`

### User ↔ Contests
- Many-to-Many relationship through participants array
- `contests.participants` contains `users.uid` values

### Contest ↔ Results
- One-to-Many relationship
- `results.contestId` references `contests.contestId`

### Game ↔ Contests
- One-to-Many relationship
- `contests.gameType` references `games.type`

### User ↔ Results
- One-to-Many relationship
- `results.userId` references `users.uid`

## 📈 Indexing Strategy

### Recommended Composite Indexes

1. **Transactions by User and Type**
   - Collection: `transactions`
   - Fields: `userId` (ASC), `type` (ASC), `createdAt` (DESC)

2. **Contests by Status and Start Time**
   - Collection: `contests`
   - Fields: `status` (ASC), `startTime` (ASC)

3. **Results by Contest and Score**
   - Collection: `results`
   - Fields: `contestId` (ASC), `score` (DESC), `timeTaken` (ASC)

4. **Leaderboard Entries**
   - Collection: `leaderboards`
   - Fields: `contestId` (ASC), `entries.score` (DESC), `entries.timeTaken` (ASC)

## 🔒 Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own document
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Users can read their own wallet
    match /wallets/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read their own transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
    }
    
    // Users can read public contests
    match /contests/{contestId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
                           request.resource.data.createdBy == request.auth.uid;
    }
    
    // Users can create their own results
    match /results/{resultId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
    }
    
    // Public read access to leaderboards
    match /leaderboards/{leaderboardId} {
      allow read: if request.auth != null;
    }
    
    // Admin access
    match /{document=**} {
      allow read, write, update, delete: if request.auth != null && 
                                         request.auth.token.admin == true;
    }
  }
}
```

## 📊 Data Validation

### Field Validation Examples

1. **Email Format**
   ```javascript
   email: {
     type: String,
     required: true,
     validate: {
       validator: function(v) {
         return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
       },
       message: props => `${props.value} is not a valid email!`
     }
   }
   ```

2. **Currency Amount**
   ```javascript
   amount: {
     type: Number,
     required: true,
     min: [0, 'Amount cannot be negative'],
     validate: {
       validator: function(v) {
         return /^\d+(\.\d{1,2})?$/.test(v.toString());
       },
       message: props => `${props.value} is not a valid currency amount!`
     }
   }
   ```

3. **Timestamp Validation**
   ```javascript
   createdAt: {
     type: Date,
     default: Date.now,
     validate: {
       validator: function(v) {
         return v <= new Date();
       },
       message: 'Creation date cannot be in the future!'
     }
   }
   ```

## 🔄 Backup and Recovery

### Automated Backup Strategy

1. **Daily Backups**
   - Enable daily exports of all collections
   - Store backups in Google Cloud Storage
   - Retain backups for 30 days

2. **Weekly Backups**
   - Full database export
   - Store in separate bucket
   - Retain backups for 1 year

3. **Manual Snapshots**
   - Before major updates
   - Triggered by admin actions
   - Stored indefinitely

### Recovery Procedures

1. **Partial Recovery**
   - Restore specific collections
   - Use Firestore import/export tools
   - Validate data integrity after restore

2. **Full Recovery**
   - Restore entire database from backup
   - Update application to use restored data
   - Notify users of maintenance period

## 📈 Performance Optimization

### Query Optimization Tips

1. **Use Indexes Liberally**
   - Create indexes for frequently queried fields
   - Use composite indexes for complex queries
   - Monitor query performance regularly

2. **Batch Operations**
   - Use batch writes for multiple document updates
   - Reduce number of individual database calls
   - Improve overall application performance

3. **Pagination**
   - Implement cursor-based pagination
   - Limit result sets to reasonable sizes
   - Use `startAfter()` for efficient pagination

### Data Modeling Best Practices

1. **Denormalization**
   - Store frequently accessed data in multiple locations
   - Trade storage for query performance
   - Keep denormalized data synchronized

2. **Subcollections**
   - Use subcollections for hierarchical data
   - Improve query performance for related data
   - Reduce document size limitations

3. **Reference Documents**
   - Store references instead of duplicating data
   - Use document IDs for relationships
   - Implement lazy loading where appropriate

## 📚 Additional Resources

- [Supabase PostgreSQL Documentation](https://supabase.com/docs/guides/database)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/data-types)