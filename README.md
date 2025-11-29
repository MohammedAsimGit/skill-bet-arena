# SkillBet Arena

A complete, fully functional skill-based competition platform built with HTML, CSS, JavaScript (Frontend), Node.js/Express (Backend), Supabase (Database), and Razorpay (Payments).

## 🎯 Overview

SkillBet Arena is a platform where users compete in skill games:
- Coding Challenges
- Maths Quiz Battles
- Memory Pattern Game
- Typing Speed Test

Users pay a small entry fee (₹10–₹50) to join contests, and winners get prize money from the prize pool. The platform takes a 10% commission from each contest.

## 🚀 Features

### Frontend (HTML/CSS/JS)
- Landing page
- Login / Signup
- Dashboard
- Wallet page
- Add money page
- Withdraw page
- Game selection
- Each game UI
- Score page
- Leaderboard
- Profile
- Settings
- Admin panel

### Backend (Node.js/Express)
- User authentication
- Wallet logic
- Entry fee deduction
- Prize distribution
- Game result validation
- Anti-cheat checks
- Contest scheduler
- Player matching

### Database (Supabase PostgreSQL)
Tables:
- users
- wallets
- transactions
- contests
- results
- leaderboards
- referrals
- admins

### Payment Integration (Razorpay)
- Add money
- Withdrawal request
- Refunds
- Webhook validation

### Admin Panel
- Create contests
- Approve withdrawals
- Ban cheaters
- View all users
- View all games
- View logs
- Adjust rewards
- Issue refund/bonuses

## 🎮 Skill Games

### A. Coding Challenge
- 3 coding questions
- Languages: JS, Python (run through server)
- Auto-judge with testcases
- Scoring = accuracy + speed
- Live timer

### B. Maths Quiz Battle
- 15 random questions
- Categories: arithmetic, algebra, speed maths
- +4 for correct, -1 for wrong

### C. Memory Pattern Game
- Flash pattern
- User repeats
- Pattern length increases
- Score = highest level reached

### D. Typing Speed Test
- 60 second typing test
- Show WPM, accuracy, errors
- Score = (WPM × accuracy%)

## 🔐 Anti-Cheat & Fairness

- Timer only from backend
- Tab switching = elimination
- Disable copy/paste in coding
- Device fingerprint
- Duplicate account detection
- Backend verifies final score

## 💰 Monetization

### Entry Fee Commission
- Platform keeps 10–15% per contest

### Ad Integration
- Rewarded ads before matches

### Subscription Plans
- Gold Pass – ₹49/month
  - No ads
  - Bonus 100 coins
  - Fast matchmaking
- Elite Pass – ₹149/month
  - Premium contests
  - Extra rewards
  - Special badge

### In-app Coins
- Can use coins for:
  - Extra attempts
  - Lifelines
  - Special themes
- Coins can NEVER be withdrawn → legal

## 🛠 Tech Architecture

### Frontend
- Pure HTML
- CSS
- JavaScript
- AJAX/Fetch API → communicate with backend
- Responsive pages

### Backend (Node.js Express)
Routes:
- `/auth/signup`
- `/auth/login`
- `/wallet/add`
- `/wallet/withdraw`
- `/contest/create`
- `/contest/join`
- `/contest/result`
- `/leaderboard`
- `/admin/*`

### Database (Supabase PostgreSQL)
Store:
- User profiles
- Balances
- Transactions
- Contests
- Winners
- Game results

### Hosting
- Frontend → Netlify/Vercel
- Backend → Render/Heroku
- Database → Supabase

## 📱 UI Features

- Modern neon gaming theme
- Smooth animations
- Clean dashboard
- Leaderboard with medals
- Wallet with clear transaction history
- Dark/Light mode

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- Supabase account
- Razorpay account

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Application Settings
PLATFORM_COMMISSION_PERCENTAGE=10
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Serve the frontend files using any static server:
```bash
# Using Python
python -m http.server 3000

# Using Node.js (install serve globally first)
npx serve -s frontend
```

2. Or deploy to Netlify/Vercel by connecting your repository.

### Supabase Setup

1. Create a Supabase project at https://app.supabase.com/
2. Enable Authentication (Email/Password)
3. Create the required database tables using the SQL schema
4. Get your project URL and keys from the Supabase dashboard

### Razorpay Setup

1. Create a Razorpay account at https://razorpay.com/
2. Get your API keys from the dashboard
3. Update your `.env` file with the keys

## ▶️ Running the Application

### Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
# Serve the frontend directory
npx serve -s frontend
```

### Production Mode

Backend:
```bash
cd backend
npm start
```

## 📖 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Wallet
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/add` - Add money to wallet
- `POST /api/wallet/verify` - Verify payment
- `POST /api/wallet/withdraw` - Request withdrawal
- `GET /api/wallet/transactions` - Get transaction history

### Contests
- `GET /api/contest` - Get all contests
- `GET /api/contest/:contestId` - Get contest by ID
- `POST /api/contest` - Create new contest
- `POST /api/contest/:contestId/join` - Join contest
- `POST /api/contest/:contestId/result` - Submit contest result
- `GET /api/contest/:contestId/leaderboard` - Get contest leaderboard

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:gameId` - Get game by ID
- `GET /api/games/coding/challenge` - Get coding challenge
- `GET /api/games/maths/quiz` - Get math quiz
- `GET /api/games/memory/game` - Get memory pattern game
- `GET /api/games/typing/test` - Get typing speed test
- `POST /api/games/result` - Submit game result

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/:leaderboardId/rank` - Get user rank
- `GET /api/leaderboard/user/performance` - Get user performance

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user by ID
- `POST /api/admin/users/:userId/ban` - Ban user
- `POST /api/admin/users/:userId/unban` - Unban user
- `GET /api/admin/transactions` - Get all transactions
- `POST /api/admin/transactions/:transactionId/approve` - Approve withdrawal
- `POST /api/admin/transactions/:transactionId/reject` - Reject withdrawal
- `GET /api/admin/stats` - Get platform statistics

## 🛡️ Security Considerations

1. All API calls use JWT authentication
2. Passwords are hashed before storing
3. Environment variables are used for sensitive data
4. Input validation on all endpoints
5. Rate limiting to prevent abuse
6. Anti-cheat mechanisms in place
7. Secure payment processing with Razorpay

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@skillbetarena.com or join our Discord server.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped build this platform
- Special thanks to the open-source community for the amazing tools and libraries