# SkillBet Arena API Documentation

This document provides comprehensive documentation for the SkillBet Arena RESTful API.

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Generation

Tokens are generated upon successful login or registration and are valid for 7 days.

## 📡 Base URL

```
https://your-backend-domain.com/api
```

## 📚 API Endpoints

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "displayName": "John Doe",
  "phoneNumber": "+919876543210",
  "referredBy": "ABC123" // Optional referral code
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "user-uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": ""
  },
  "token": "jwt-token"
}
```

**Status Codes:**
- `201` Created
- `400` Bad Request
- `500` Internal Server Error

#### POST `/auth/login`
Login existing user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "uid": "user-uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": ""
  },
  "token": "jwt-token"
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `404` Not Found
- `500` Internal Server Error

#### GET `/auth/profile`
Get authenticated user's profile

**Response:**
```json
{
  "user": {
    "uid": "user-uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "phoneNumber": "+919876543210",
    "photoURL": "",
    "createdAt": "2023-06-01T10:00:00.000Z",
    "lastLoginAt": "2023-06-20T15:30:00.000Z",
    "isEmailVerified": true,
    "disabled": false,
    "walletBalance": 250.00,
    "totalEarnings": 1200.00,
    "gamesPlayed": 45,
    "gamesWon": 32,
    "winRate": 71,
    "referralCode": "XYZ789",
    "referredBy": "ABC123",
    "subscriptionType": "gold",
    "subscriptionExpiry": "2023-07-20T15:30:00.000Z",
    "deviceFingerprint": "device-fingerprint-hash",
    "isBanned": false
  }
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `404` Not Found
- `500` Internal Server Error

#### PUT `/auth/profile`
Update user profile

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "phoneNumber": "+919876543211",
  "photoURL": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `500` Internal Server Error

### Wallet Endpoints

#### GET `/wallet`
Get user's wallet information

**Response:**
```json
{
  "wallet": {
    "userId": "user-uid",
    "balance": 250.00,
    "totalDeposits": 1500.00,
    "totalWithdrawals": 300.00,
    "totalEarnings": 450.00,
    "totalSpent": 700.00,
    "currency": "INR",
    "createdAt": "2023-06-01T10:00:00.000Z",
    "updatedAt": "2023-06-20T15:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `500` Internal Server Error

#### POST `/wallet/add`
Add money to wallet (initiate payment)

**Request Body:**
```json
{
  "amount": 500,
  "paymentMethod": "razorpay" // Optional
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "orderId": "order_ABC123",
  "amount": 50000, // in paise
  "currency": "INR"
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `500` Internal Server Error

#### POST `/wallet/verify`
Verify payment and update wallet

**Request Body:**
```json
{
  "razorpay_order_id": "order_ABC123",
  "razorpay_payment_id": "pay_DEF456",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "message": "Payment verified and wallet updated successfully",
  "transactionId": "txn_GHI789",
  "balance": 750.00
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `404` Not Found
- `500` Internal Server Error

#### POST `/wallet/withdraw`
Request withdrawal

**Request Body:**
```json
{
  "amount": 200,
  "withdrawalMethod": "bank_transfer",
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0002499",
    "accountHolderName": "John Doe"
  }
}
```

**Response:**
```json
{
  "message": "Withdrawal request submitted successfully",
  "transactionId": "txn_JKL012"
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `500` Internal Server Error

#### GET `/wallet/transactions`
Get transaction history

**Query Parameters:**
- `limit`: Number of transactions to return (default: 50)
- `offset`: Number of transactions to skip (default: 0)

**Response:**
```json
{
  "transactions": [
    {
      "transactionId": "txn_ABC123",
      "userId": "user-uid",
      "type": "deposit",
      "amount": 500.00,
      "currency": "INR",
      "status": "completed",
      "paymentMethod": "razorpay",
      "description": "Deposit of ₹500",
      "referenceId": "order_DEF456",
      "createdAt": "2023-06-20T10:30:00.000Z",
      "completedAt": "2023-06-20T10:32:00.000Z",
      "metadata": {
        "razorpayOrderId": "order_DEF456",
        "razorpayPaymentId": "pay_GHI789"
      }
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `500` Internal Server Error

### Contest Endpoints

#### GET `/contest`
Get all contests

**Query Parameters:**
- `status`: Filter by status (upcoming, ongoing, completed, cancelled)
- `gameType`: Filter by game type (coding, maths, memory, typing)
- `difficulty`: Filter by difficulty (beginner, intermediate, expert)

**Response:**
```json
{
  "contests": [
    {
      "contestId": "ctst_ABC123",
      "title": "Coding Challenge - Expert",
      "description": "Test your programming skills",
      "gameType": "coding",
      "entryFee": 50.00,
      "prizePool": 450.00,
      "platformCommission": 50.00,
      "maxPlayers": 10,
      "currentPlayers": 8,
      "status": "upcoming",
      "startTime": "2023-06-21T15:00:00.000Z",
      "endTime": null,
      "duration": 1800,
      "createdBy": "admin-uid",
      "createdAt": "2023-06-20T10:00:00.000Z",
      "updatedAt": "2023-06-20T14:30:00.000Z",
      "participants": ["user1-uid", "user2-uid"],
      "winners": [],
      "questions": [],
      "difficulty": "expert",
      "isPrivate": false,
      "accessCode": ""
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### GET `/contest/:contestId`
Get contest by ID

**Response:**
```json
{
  "contest": {
    "contestId": "ctst_ABC123",
    // ... full contest object
  }
}
```

**Status Codes:**
- `200` OK
- `404` Not Found
- `500` Internal Server Error

#### POST `/contest`
Create new contest (Admin only)

**Request Body:**
```json
{
  "title": "Maths Quiz - Intermediate",
  "description": "Fast-paced mathematical challenges",
  "gameType": "maths",
  "entryFee": 20.00,
  "maxPlayers": 10,
  "startTime": "2023-06-21T16:00:00.000Z",
  "duration": 600,
  "difficulty": "intermediate",
  "isPrivate": false,
  "accessCode": "",
  "questions": [] // Optional
}
```

**Response:**
```json
{
  "message": "Contest created successfully",
  "contest": {
    "contestId": "ctst_DEF456",
    // ... full contest object
  }
}
```

**Status Codes:**
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `500` Internal Server Error

#### POST `/contest/:contestId/join`
Join contest

**Response:**
```json
{
  "message": "Successfully joined contest",
  "contest": {
    "contestId": "ctst_ABC123",
    // ... updated contest object
  },
  "balance": 200.00
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `404` Not Found
- `500` Internal Server Error

#### POST `/contest/:contestId/result`
Submit contest result

**Request Body:**
```json
{
  "score": 85,
  "timeTaken": 300,
  "answers": {
    "q1": "answer1",
    "q2": "answer2"
  }
}
```

**Response:**
```json
{
  "message": "Result submitted successfully",
  "result": {
    "resultId": "res_GHI789",
    "userId": "user-uid",
    "contestId": "ctst_ABC123",
    "score": 85,
    "timeTaken": 300,
    "answers": {
      "q1": "answer1",
      "q2": "answer2"
    },
    "submittedAt": "2023-06-21T16:30:00.000Z"
  }
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

#### GET `/contest/:contestId/leaderboard`
Get contest leaderboard

**Response:**
```json
{
  "results": [
    {
      "userId": "user1-uid",
      "contestId": "ctst_ABC123",
      "score": 95,
      "timeTaken": 280,
      "answers": {},
      "submittedAt": "2023-06-21T16:25:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

### Game Endpoints

#### GET `/games`
Get all games

**Response:**
```json
{
  "games": [
    {
      "id": "coding",
      "name": "Coding Challenge",
      "description": "Test your programming skills",
      "icon": "fas fa-code",
      "difficultyLevels": ["beginner", "intermediate", "expert"]
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### GET `/games/:gameId`
Get game by ID

**Response:**
```json
{
  "game": {
    "id": "coding",
    "name": "Coding Challenge",
    // ... full game object
  }
}
```

**Status Codes:**
- `200` OK
- `404` Not Found
- `500` Internal Server Error

#### GET `/games/coding/challenge`
Get coding challenge

**Query Parameters:**
- `difficulty`: beginner, intermediate, expert (default: beginner)

**Response:**
```json
{
  "challenge": {
    "challengeId": "chal_ABC123",
    "title": "Two Sum Problem",
    "description": "Find two numbers that add up to target",
    "difficulty": "beginner",
    "timeLimit": 1800,
    "languages": ["javascript", "python"],
    "problemStatement": "Given an array...",
    "inputFormat": "...",
    "outputFormat": "...",
    "constraints": "...",
    "sampleInput": "...",
    "sampleOutput": "...",
    "testCases": [...],
    "solutionTemplate": {...},
    "tags": ["array", "hash-table"]
  }
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### GET `/games/maths/quiz`
Get math quiz

**Query Parameters:**
- `difficulty`: beginner, intermediate, expert (default: beginner)

**Response:**
```json
{
  "quiz": {
    "quizId": "quiz_DEF456",
    "title": "Speed Maths Challenge",
    "description": "Test your mathematical skills",
    "category": "arithmetic",
    "difficulty": "beginner",
    "timeLimit": 600,
    "numberOfQuestions": 15,
    "scoring": { "correct": 4, "incorrect": -1, "unanswered": 0 },
    "questions": [...],
    "tags": ["arithmetic", "speed-maths"]
  }
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### GET `/games/memory/game`
Get memory pattern game

**Query Parameters:**
- `difficulty`: beginner, intermediate, expert (default: beginner)

**Response:**
```json
{
  "game": {
    "gameId": "mem_GHI789",
    "title": "Pattern Memory Challenge",
    "description": "Memorize and repeat patterns",
    "difficulty": "beginner",
    "timeLimit": 300,
    "maxLevel": 20,
    "patternTypes": ["sequence", "grid", "color"],
    "scoring": { "basePoints": 10, "multiplier": 1.2 },
    "tags": ["memory", "pattern-recognition"]
  }
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### GET `/games/typing/test`
Get typing speed test

**Query Parameters:**
- `difficulty`: beginner, intermediate, expert (default: beginner)

**Response:**
```json
{
  "test": {
    "testId": "typ_JKL012",
    "title": "Typing Speed Challenge",
    "description": "Test your typing speed",
    "difficulty": "beginner",
    "timeLimit": 60,
    "texts": [...],
    "scoring": { "accuracyWeight": 0.7, "speedWeight": 0.3, "minAccuracy": 50 },
    "tags": ["typing", "speed"]
  }
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### POST `/games/result`
Submit game result

**Request Body:**
```json
{
  "gameId": "coding",
  "score": 90,
  "timeTaken": 450,
  "answers": {
    "challenge1": "solution code"
  },
  "metadata": {
    "language": "javascript"
  }
}
```

**Response:**
```json
{
  "message": "Game result submitted successfully",
  "resultId": "res_MNO345",
  "result": {
    "userId": "user-uid",
    "gameId": "coding",
    "score": 90,
    "timeTaken": 450,
    "answers": {
      "challenge1": "solution code"
    },
    "metadata": {
      "language": "javascript"
    },
    "submittedAt": "2023-06-21T17:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `500` Internal Server Error

### Leaderboard Endpoints

#### GET `/leaderboard`
Get global leaderboard

**Query Parameters:**
- `gameType`: Filter by game type
- `limit`: Number of entries to return (default: 50)

**Response:**
```json
{
  "leaderboard": {
    "leaderboardId": "ldr_PQR678",
    "contestId": null,
    "gameType": "overall",
    "entries": [
      {
        "userId": "user1-uid",
        "score": 1250,
        "timeTaken": 3600,
        "rank": 1,
        "submittedAt": "2023-06-20T15:00:00.000Z"
      }
    ],
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2023-06-21T17:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

#### GET `/leaderboard/:leaderboardId/rank`
Get user rank in leaderboard

**Response:**
```json
{
  "rank": 24
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `404` Not Found
- `500` Internal Server Error

#### GET `/leaderboard/user/performance`
Get user's performance history

**Response:**
```json
{
  "results": [
    {
      "resultId": "res_STU901",
      "userId": "user-uid",
      "contestId": "ctst_ABC123",
      "gameId": "coding",
      "score": 85,
      "timeTaken": 300,
      "answers": {},
      "submittedAt": "2023-06-21T16:30:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `500` Internal Server Error

### Admin Endpoints

#### GET `/admin/users`
Get all users (Admin only)

**Query Parameters:**
- `limit`: Number of users to return (default: 50)
- `offset`: Number of users to skip (default: 0)

**Response:**
```json
{
  "users": [
    {
      "uid": "user1-uid",
      "email": "user1@example.com",
      "displayName": "User One",
      // ... full user object
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden
- `500` Internal Server Error

#### GET `/admin/users/:userId`
Get user by ID (Admin only)

**Response:**
```json
{
  "user": {
    "uid": "user1-uid",
    "email": "user1@example.com",
    "displayName": "User One",
    // ... full user object
  }
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

#### POST `/admin/users/:userId/ban`
Ban user (Admin only)

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Response:**
```json
{
  "message": "User banned successfully"
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

#### POST `/admin/users/:userId/unban`
Unban user (Admin only)

**Response:**
```json
{
  "message": "User unbanned successfully"
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

#### GET `/admin/transactions`
Get all transactions (Admin only)

**Query Parameters:**
- `limit`: Number of transactions to return (default: 50)
- `offset`: Number of transactions to skip (default: 0)
- `status`: Filter by status

**Response:**
```json
{
  "transactions": [
    {
      "transactionId": "txn_VWX234",
      // ... full transaction object
    }
  ]
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden
- `500` Internal Server Error

#### POST `/admin/transactions/:transactionId/approve`
Approve withdrawal (Admin only)

**Response:**
```json
{
  "message": "Withdrawal approved successfully",
  "transaction": {
    "transactionId": "txn_VWX234",
    // ... updated transaction object
  }
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

#### POST `/admin/transactions/:transactionId/reject`
Reject withdrawal (Admin only)

**Request Body:**
```json
{
  "reason": "Invalid bank details"
}
```

**Response:**
```json
{
  "message": "Withdrawal rejected and amount refunded",
  "transaction": {
    "transactionId": "txn_VWX234",
    // ... updated transaction object
  }
}
```

**Status Codes:**
- `200` OK
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

#### GET `/admin/stats`
Get platform statistics (Admin only)

**Response:**
```json
{
  "stats": {
    "totalUsers": 1240,
    "totalContests": 45,
    "totalTransactions": 890,
    "totalRevenue": 45200.00
  }
}
```

**Status Codes:**
- `200` OK
- `401` Unauthorized
- `403` Forbidden
- `500` Internal Server Error

### Razorpay Endpoints

#### POST `/razorpay/webhook`
Razorpay webhook endpoint

**Request Body:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_ABC123",
        "order_id": "order_DEF456",
        // ... payment details
      }
    }
  }
}
```

**Response:**
```json
{
  "message": "Webhook received and processed successfully"
}
```

**Status Codes:**
- `200` OK
- `500` Internal Server Error

## 📈 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **Admin requests**: 5000 requests per hour

Exceeding these limits will result in a `429 Too Many Requests` response.

## 🛡️ Error Responses

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` Bad Request - Invalid request data
- `401` Unauthorized - Missing or invalid authentication
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server-side error

## 🔐 Security Considerations

1. **HTTPS Only** - All API requests must be made over HTTPS
2. **JWT Tokens** - Use secure, signed JWT tokens with expiration
3. **Input Validation** - All inputs are validated and sanitized
4. **CORS** - Proper CORS configuration to prevent unauthorized access
5. **Rate Limiting** - Prevent abuse through rate limiting
6. **Logging** - Comprehensive logging for security monitoring

## 🔄 Versioning

The API follows semantic versioning. Breaking changes will be introduced in new major versions, with appropriate version paths:

```
https://your-backend-domain.com/api/v1/...
https://your-backend-domain.com/api/v2/...
```

Currently, the API is at version 1.0.0.

## 📞 Support

For API support, contact:
- Email: api-support@skillbetarena.com
- Documentation: https://docs.skillbetarena.com/api

## 📄 License

This API documentation is part of the SkillBet Arena project and follows the same license terms.