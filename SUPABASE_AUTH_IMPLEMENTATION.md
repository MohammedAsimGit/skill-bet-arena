# Supabase Auth Implementation Guide

This guide details how to implement authentication using Supabase Auth in the SkillBet Arena application.

## Overview

Supabase Auth provides a complete user management system with features including:
- Email/Password authentication
- Social OAuth providers (Google, GitHub, etc.)
- Email verification
- Password reset
- Session management

## Backend Implementation

### 1. Authentication Utilities

The `backend/utils/supabaseAuth.js` file provides helper functions for common authentication operations:

```javascript
const { supabase } = require('./supabase');

// Sign up a new user
async function signUpUser(email, password, displayName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

// Logout user
async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { message: 'Logged out successfully' };
  } catch (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}
```

### 2. Authentication Middleware

The `backend/middleware/auth.middleware.js` file handles authentication for protected routes:

```javascript
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Attach user to request object
    req.user = {
      uid: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email,
      photoURL: user.user_metadata?.photo_url || ''
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};
```

### 3. Auth Controller

The `backend/controllers/auth.controller.js` handles authentication-related API endpoints:

```javascript
// Register new user
const register = async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber, referredBy } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Create user in Supabase Authentication
    const { data: authData, error: authError } = await signUpUser(email, password, displayName);
    
    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Generate referral code
    const referralCode = generateReferralCode();

    // Create user record in Supabase database
    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      display_name: displayName || email.split('@')[0],
      phone_number: phoneNumber || '',
      photo_url: '',
      created_at: new Date(),
      last_login_at: new Date(),
      is_email_verified: authData.user.email_confirmed_at ? true : false,
      wallet_balance: 0,
      total_earnings: 0,
      games_played: 0,
      games_won: 0,
      win_rate: 0,
      referral_code: referralCode,
      referred_by: referredBy || '',
      subscription_type: 'free',
      subscription_expiry: null,
      device_fingerprint: '',
      is_banned: false
    };

    // Insert user into users table
    const userRecord = await insert('users', userData);

    // If user was referred, update referrer's data
    if (referredBy) {
      const referrerUsers = await select('users', { referral_code: referredBy }, { limit: 1 });

      if (referrerUsers.length > 0) {
        const referrer = referrerUsers[0];
        // Add referral bonus logic here if needed
        // For now, we'll just increment their referral count
        await insert('referrals', {
          referrer_id: referrer.id,
          referred_id: userRecord.id,
          created_at: new Date()
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { uid: userRecord.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.id,
        email: userRecord.email,
        displayName: userRecord.display_name,
        photoURL: userRecord.photo_url
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
};
```

## Frontend Implementation

### 1. Supabase Client

The `frontend/assets/js/supabase.js` file initializes the Supabase client:

```javascript
// Supabase client configuration for frontend
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm';

// Supabase configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'your-actual-anon-key-here'; // Replace with your Supabase anon key

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
```

### 2. Authentication Functions

The `frontend/assets/js/auth.js` file provides frontend authentication functions:

```javascript
// Authentication functions using Supabase
import { supabase } from './supabase.js';

// Register new user
async function registerUser(userData) {
  try {
    const { email, password, displayName } = userData;
    
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Store additional user data in the database
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
          created_at: new Date()
        });
      
      if (insertError) {
        throw new Error(insertError.message);
      }
    }
    
    return data;
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

// Login user
async function loginUser(credentials) {
  try {
    const { email, password } = credentials;
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}
```

### 3. Login Page Integration

The `frontend/pages/login.html` file integrates Supabase authentication:

```html
<script type="module" src="../assets/js/main.js"></script>
<script type="module">
    import { loginUser } from '../assets/js/auth.js';
    
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('loginForm');
        
        // Handle form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // Show loading state
                const submitButton = loginForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                submitButton.disabled = true;
                
                // Attempt to login
                const result = await loginUser({ email, password });
                
                // On success, redirect to dashboard
                alert('Login successful!');
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert('Login failed: ' + error.message);
            } finally {
                // Reset button state
                const submitButton = loginForm.querySelector('button[type="submit"]');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    });
</script>
```

## Configuration

### Environment Variables

Update your `.env` file with Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

### Enabling Auth Providers

In the Supabase Dashboard:

1. Go to Authentication → Settings
2. Enable Email/Password provider
3. Configure email templates as needed
4. Set up OAuth providers if required (Google, GitHub, etc.)

## Security Considerations

### JWT Tokens

Supabase uses JWT tokens for authentication. Ensure your JWT secret is kept secure:

```javascript
// Generate JWT token
const token = jwt.sign(
  { uid: userRecord.id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);
```

### Session Management

Supabase automatically manages sessions. You can listen for auth state changes:

```javascript
// Listen for auth state changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth state changed:', event, session);
  }
);
```

### Password Security

Supabase handles password hashing and security automatically. For frontend validation:

```javascript
function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return re.test(password);
}
```

## Testing

### Unit Tests

Create tests for authentication functions:

```javascript
// Test user registration
test('should register a new user', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'Test1234!',
    displayName: 'Test User'
  };
  
  const result = await registerUser(userData);
  expect(result.user).toBeDefined();
  expect(result.user.email).toBe(userData.email);
});
```

### Integration Tests

Test the full authentication flow:

```javascript
// Test login flow
test('should login existing user', async () => {
  const credentials = {
    email: 'test@example.com',
    password: 'Test1234!'
  };
  
  const result = await loginUser(credentials);
  expect(result.user).toBeDefined();
  expect(result.session).toBeDefined();
});
```

## Troubleshooting

### Common Issues

1. **Invalid token errors**: Check JWT secret configuration
2. **User not found**: Verify user exists in auth.users table
3. **Permission denied**: Check RLS policies
4. **Network errors**: Verify Supabase URL and connectivity

### Debugging Tips

1. Enable Supabase logs in the dashboard
2. Use browser developer tools to inspect network requests
3. Check server console for error messages
4. Verify environment variables are correctly set

## Migration from Firebase

### Key Differences

1. **User IDs**: Supabase uses UUIDs vs Firebase's string IDs
2. **Session Management**: Supabase uses JWT vs Firebase's custom tokens
3. **Database Integration**: Supabase Auth integrates directly with PostgreSQL

### Migration Steps

1. Update authentication functions to use Supabase
2. Migrate user data to Supabase Auth
3. Update frontend to use Supabase Auth
4. Test authentication flows thoroughly

## Best Practices

1. **Always use HTTPS** in production
2. **Validate input** on both frontend and backend
3. **Handle errors gracefully** with user-friendly messages
4. **Implement rate limiting** for authentication endpoints
5. **Use environment variables** for sensitive configuration
6. **Regularly rotate** JWT secrets
7. **Monitor authentication logs** for suspicious activity

## Support

For issues with Supabase Auth implementation:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)