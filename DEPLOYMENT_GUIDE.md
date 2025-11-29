# SkillBet Arena Deployment Guide

This guide provides step-by-step instructions for deploying the SkillBet Arena platform to production environments.

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Domain names** for frontend and backend (optional but recommended)
2. **Supabase Project** with PostgreSQL and Authentication enabled
3. **Razorpay Account** with API keys
4. **GitHub/GitLab account** for version control (recommended)
5. **Deployment platforms accounts**:
   - Frontend: Vercel, Netlify, or similar
   - Backend: Render, Heroku, or similar

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Database      │
│  (HTML/CSS/JS)  │◄──►│  (Node.js/Express)│◄──►│ (Supabase)      │
│  Vercel/Netlify │    │  Render/Heroku   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │  Razorpay   │
                       │ (Payments)  │
                       └─────────────┘
```

## § Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Console](https://app.supabase.com/)
2. Click "New Project" and follow the setup wizard
3. Enable the following services:
   - PostgreSQL Database
   - Authentication (Email/Password provider)

### 1.2 Get Supabase Credentials

1. In Supabase Console, go to Project Settings
2. Navigate to "API" tab
3. Note down your:
   - Project URL
   - Anon Key
   - Service Role Key

### 1.3 Configure Supabase RLS Policies

In the Supabase SQL Editor, set up Row Level Security policies:

```sql
-- Users table
alter table users enable row level security;
create policy "Users can view own user data" on users for select using (auth.uid() = id);
create policy "Users can update own user data" on users for update using (auth.uid() = id);

-- Wallets table
alter table wallets enable row level security;
create policy "Users can view own wallet" on wallets for select using (auth.uid() = user_id);
create policy "Users can update own wallet" on wallets for update using (auth.uid() = user_id);

-- Transactions table
alter table transactions enable row level security;
create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);

-- Contests table
alter table contests enable row level security;
create policy "Everyone can view contests" on contests for select using (true);
create policy "Users can create contests" on contests for insert with check (auth.uid() = created_by);

-- Results table
alter table results enable row level security;
create policy "Everyone can view results" on results for select using (true);
create policy "Users can create results" on results for insert with check (auth.uid() = user_id);

-- Admin access
alter table admins enable row level security;
create policy "Admins have full access" on admins for all using (is_admin(auth.uid()));
```

## 💳 Step 2: Razorpay Setup

### 2.1 Create Razorpay Account

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up and complete business verification

### 2.2 Get API Keys

1. In the dashboard, go to "Settings" → "API Keys"
2. Note down your:
   - Key ID
   - Key Secret

### 2.3 Configure Webhooks

1. In the dashboard, go to "Settings" → "Webhooks"
2. Add a new webhook with:
   - URL: `https://your-backend-domain.com/api/razorpay/webhook`
   - Events: Select all payment events
   - Secret: Create a strong secret for verification

## ⚙️ Step 3: Backend Deployment

### 3.1 Environment Configuration

Create a `.env.production` file in the `backend` directory:

```env
# Server Configuration
PORT=8080
NODE_ENV=production

# Firebase Configuration (from your service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Application Settings
PLATFORM_COMMISSION_PERCENTAGE=10
```

### 3.2 Deploy to Render (Recommended)

1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service:
   - Name: `skillbet-arena-backend`
   - Region: Choose closest to your users
   - Branch: `main` (or your deployment branch)
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free or Starter (based on traffic expectations)

4. Add Environment Variables:
   - Copy all variables from your `.env.production` file

5. Deploy!

### 3.3 Deploy to Heroku (Alternative)

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create skillbet-arena-backend`
4. Set environment variables:
   ```bash
   heroku config:set PORT=8080
   heroku config:set NODE_ENV=production
   # Add all other environment variables
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

## 🌐 Step 4: Frontend Deployment

### 4.1 Update API Endpoints

In `frontend/assets/js/main.js`, update the API base URL:

```javascript
// Change from:
const API_BASE_URL = 'http://localhost:5000/api';

// To your deployed backend URL:
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

### 4.2 Deploy to Vercel (Recommended)

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Create a new project:
   - Name: `skillbet-arena-frontend`
   - Framework Preset: Other
   - Root Directory: `frontend`
   - Build Command: (leave empty for static sites)
   - Output Directory: (leave empty for static sites)
4. Deploy!

### 4.3 Deploy to Netlify (Alternative)

1. Create a Netlify account at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Create a new site:
   - Base directory: `frontend`
   - Build command: (leave empty for static sites)
   - Publish directory: (leave empty for static sites)
4. Deploy!

## 🔧 Step 5: Post-Deployment Configuration

### 5.1 Domain Setup

#### Backend Domain
1. In Render/Heroku dashboard, add your custom domain
2. Update DNS records as instructed
3. Enable SSL certificate

#### Frontend Domain
1. In Vercel/Netlify dashboard, add your custom domain
2. Update DNS records as instructed
3. Enable SSL certificate

### 5.2 Update Environment Variables

Ensure all environment variables are correctly set in your production environment:

1. Backend URL in frontend JavaScript
2. Supabase credentials
3. Razorpay API keys
4. JWT secrets

### 5.3 Test All Features

1. User registration and login
2. Wallet deposit and withdrawal
3. Contest creation and joining
4. Game play and result submission
5. Payment processing
6. Admin panel functionality

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, randomly generated secrets
- Rotate secrets periodically

### 2. HTTPS Enforcement
- Ensure all deployments use HTTPS
- Redirect HTTP to HTTPS
- Use strong SSL certificates

### 3. CORS Configuration
Update CORS settings in `backend/server.js`:

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

### 4. Rate Limiting
Consider adding rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 5. Input Validation
Always validate and sanitize user inputs:

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

## 📊 Monitoring and Analytics

### 1. Application Monitoring
- Set up logging with Winston or similar
- Use error tracking with Sentry
- Monitor performance with New Relic or similar

### 2. Uptime Monitoring
- Use UptimeRobot or similar services
- Set up alerts for downtime

### 3. Performance Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies

## 🔁 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy SkillBet Arena

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        github-token: ${{ secrets.GITHUB_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Render
      run: |
        curl -X POST https://api.render.com/deploy/srv-xxxxxxxxxx?key=${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in backend
   - Ensure frontend domain is whitelisted

2. **Firebase Authentication Issues**
   - Verify service account credentials
   - Check Firebase project ID

3. **Payment Processing Failures**
   - Confirm Razorpay API keys
   - Check webhook configuration

4. **Slow Performance**
   - Enable gzip compression
   - Optimize database queries
   - Use CDN for static assets

### Logs and Debugging

1. Check deployment platform logs
2. Enable detailed logging in application
3. Use browser developer tools for frontend issues
4. Monitor Supabase console for database errors

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Security Updates**
   - Regularly update dependencies
   - Monitor for vulnerabilities
   - Rotate API keys periodically

2. **Backup Strategy**
   - Enable Supabase automatic backups
   - Regular database exports
   - Version control all code

3. **Performance Monitoring**
   - Monitor response times
   - Track error rates
   - Optimize slow queries

### Scaling Considerations

1. **Database Scaling**
   - Monitor Firestore usage
   - Optimize queries with indexes
   - Consider partitioning large collections

2. **Application Scaling**
   - Enable auto-scaling on hosting platform
   - Use load balancing
   - Implement caching strategies

## 📞 Support

For deployment assistance, contact:
- Email: support@skillbetarena.com
- Discord: [Your Discord Server]

## 📄 License

This deployment guide is part of the SkillBet Arena project and follows the same license terms.