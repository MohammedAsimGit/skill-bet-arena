# Frontend JavaScript Migration to Supabase

This guide details how to update the frontend JavaScript code to use Supabase instead of Firebase in the SkillBet Arena application.

## Overview

The migration involves replacing Firebase SDK calls with Supabase client library calls throughout the frontend codebase while maintaining the same user experience and functionality.

## File-by-File Migration

### 1. Main Application File (main.js)

**Before (Firebase):**
```javascript
// User authentication functions
async function registerUser(userData) {
  try {
    const result = await apiCall('/auth/signup', 'POST', userData);
    // Store token in localStorage
    localStorage.setItem('token', result.token);
    return result;
  } catch (error) {
    throw error;
  }
}

async function loginUser(credentials) {
  try {
    const result = await apiCall('/auth/login', 'POST', credentials);
    // Store token in localStorage
    localStorage.setItem('token', result.token);
    return result;
  } catch (error) {
    throw error;
  }
}

function logoutUser() {
  localStorage.removeItem('token');
  // Redirect to home page
  window.location.href = '../index.html';
}

function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  // In a real implementation, you would decode the JWT token
  // For now, we'll just return a placeholder
  return {
    isAuthenticated: true,
    // Add user data here if available
  };
}
```

**After (Supabase):**
```javascript
// Import Supabase functions
import { registerUser as supabaseRegister, loginUser as supabaseLogin, logoutUser as supabaseLogout, getCurrentUser as supabaseGetCurrentUser } from './auth.js';

// User authentication functions
async function registerUser(userData) {
  try {
    const result = await supabaseRegister(userData);
    // Store session in localStorage
    if (result.session) {
      localStorage.setItem('supabase.auth.token', result.session.access_token);
    }
    return result;
  } catch (error) {
    throw error;
  }
}

async function loginUser(credentials) {
  try {
    const result = await supabaseLogin(credentials);
    // Store session in localStorage
    if (result.session) {
      localStorage.setItem('supabase.auth.token', result.session.access_token);
    }
    return result;
  } catch (error) {
    throw error;
  }
}

async function logoutUser() {
  try {
    await supabaseLogout();
    localStorage.removeItem('supabase.auth.token');
    // Redirect to home page
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function getCurrentUser() {
  try {
    const user = await supabaseGetCurrentUser();
    return user ? { isAuthenticated: true, ...user } : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}
```

### 2. Authentication Pages

#### Login Page (login.html)

**Before (Firebase):**
```html
<script src="../assets/js/main.js"></script>
<script>
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
        const result = await SkillBetArena.loginUser({ email, password });
        
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

**After (Supabase):**
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

#### Signup Page (signup.html)

**Before (Firebase):**
```html
<script src="../assets/js/main.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    
    // Handle form submission
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const referral = document.getElementById('referral').value;
      
      // Validation
      if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (!SkillBetArena.validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      if (!SkillBetArena.validatePassword(password)) {
        alert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
        return;
      }
      
      try {
        // Show loading state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitButton.disabled = true;
        
        // Prepare user data
        const userData = {
          email,
          password,
          displayName: name
        };
        
        // Add referral code if provided
        if (referral) {
          userData.referredBy = referral;
        }
        
        // Attempt to register
        const result = await SkillBetArena.registerUser(userData);
        
        // On success, redirect to dashboard
        alert('Account created successfully!');
        window.location.href = 'dashboard.html';
      } catch (error) {
        alert('Registration failed: ' + error.message);
      } finally {
        // Reset button state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  });
</script>
```

**After (Supabase):**
```html
<script type="module" src="../assets/js/main.js"></script>
<script type="module">
  import { registerUser } from '../assets/js/auth.js';
  
  document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    
    // Handle form submission
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const referral = document.getElementById('referral').value;
      
      // Validation
      if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (!SkillBetArena.validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      if (!SkillBetArena.validatePassword(password)) {
        alert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
        return;
      }
      
      try {
        // Show loading state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitButton.disabled = true;
        
        // Prepare user data
        const userData = {
          email,
          password,
          displayName: name
        };
        
        // Add referral code if provided
        if (referral) {
          userData.referredBy = referral;
        }
        
        // Attempt to register
        const result = await registerUser(userData);
        
        // On success, redirect to dashboard
        alert('Account created successfully!');
        window.location.href = 'dashboard.html';
      } catch (error) {
        alert('Registration failed: ' + error.message);
      } finally {
        // Reset button state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  });
</script>
```

### 3. Dashboard Page

#### Dashboard JavaScript (dashboard.js)

**Before (Firebase/API):**
```javascript
// Dashboard specific functionality
document.addEventListener('DOMContentLoaded', async () => {
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        SkillBetArena.logoutUser();
      }
    });
  }
  
  // Load user dashboard data
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Fetch user profile
    const userProfile = await SkillBetArena.apiCall('/auth/profile', 'GET');
    
    // Fetch wallet data
    const walletData = await SkillBetArena.getWallet();
    
    // Fetch user stats
    const userStats = await SkillBetArena.apiCall('/user/stats', 'GET');
    
    // Fetch active contests
    const activeContests = await SkillBetArena.getContests();
    
    // Update UI with fetched data
    updateDashboardUI(userProfile, walletData, userStats, activeContests);
    
    // Hide loading state
    hideLoadingState();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    hideLoadingState();
    showError('Failed to load dashboard data. Please try again later.');
  }
}
```

**After (Supabase):**
```javascript
// Dashboard specific functionality
import { supabase } from './supabase.js';
import { getUserProfile, getWallet, getContests } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        SkillBetArena.logoutUser();
      }
    });
  }
  
  // Load user dashboard data
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Fetch user profile
    const currentUser = await supabase.auth.getUser();
    const userProfile = await getUserProfile(currentUser.data.user.id);
    
    // Fetch wallet data
    const walletData = await getWallet(currentUser.data.user.id);
    
    // Fetch user stats (using existing API for now)
    const userStats = await SkillBetArena.apiCall('/user/stats', 'GET');
    
    // Fetch active contests
    const activeContests = await getContests();
    
    // Update UI with fetched data
    updateDashboardUI(userProfile, walletData, userStats, activeContests);
    
    // Hide loading state
    hideLoadingState();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    hideLoadingState();
    showError('Failed to load dashboard data. Please try again later.');
  }
}
```

### 4. Profile Page

#### Profile JavaScript (profile.js)

**Before (Firebase):**
```javascript
// Profile page functionality
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfileData();
});

async function loadProfileData() {
  try {
    // Fetch user profile
    const userProfile = await SkillBetArena.apiCall('/auth/profile', 'GET');
    
    // Update UI
    updateProfileUI(userProfile);
  } catch (error) {
    console.error('Error loading profile data:', error);
    showError('Failed to load profile data. Please try again later.');
  }
}

async function updateProfile(formData) {
  try {
    // Update user profile
    const result = await SkillBetArena.apiCall('/auth/profile', 'PUT', formData);
    
    // Show success message
    showSuccess('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    showError('Failed to update profile. Please try again later.');
  }
}
```

**After (Supabase):**
```javascript
// Profile page functionality
import { supabase } from './supabase.js';
import { getUserProfile, updateUserProfile } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfileData();
});

async function loadProfileData() {
  try {
    // Fetch user profile
    const currentUser = await supabase.auth.getUser();
    const userProfile = await getUserProfile(currentUser.data.user.id);
    
    // Update UI
    updateProfileUI(userProfile);
  } catch (error) {
    console.error('Error loading profile data:', error);
    showError('Failed to load profile data. Please try again later.');
  }
}

async function updateProfile(formData) {
  try {
    // Update user profile
    const currentUser = await supabase.auth.getUser();
    const updatedProfile = await updateUserProfile(currentUser.data.user.id, formData);
    
    // Show success message
    showSuccess('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    showError('Failed to update profile. Please try again later.');
  }
}
```

### 5. Wallet Page

#### Wallet JavaScript (wallet.js)

**Before (Firebase/API):**
```javascript
// Wallet page functionality
document.addEventListener('DOMContentLoaded', async () => {
  await loadWalletData();
});

async function loadWalletData() {
  try {
    // Fetch wallet data
    const walletData = await SkillBetArena.getWallet();
    
    // Update UI
    updateWalletUI(walletData);
  } catch (error) {
    console.error('Error loading wallet data:', error);
    showError('Failed to load wallet data. Please try again later.');
  }
}

async function addMoneyToWallet(amount) {
  try {
    // Add money to wallet
    const result = await SkillBetArena.addMoneyToWallet(amount);
    
    // Update UI
    updateWalletUI(result.wallet);
    
    // Show success message
    showSuccess('Money added to wallet successfully!');
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    showError('Failed to add money to wallet. Please try again later.');
  }
}
```

**After (Supabase):**
```javascript
// Wallet page functionality
import { supabase } from './supabase.js';
import { getWallet } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadWalletData();
});

async function loadWalletData() {
  try {
    // Fetch wallet data
    const currentUser = await supabase.auth.getUser();
    const walletData = await getWallet(currentUser.data.user.id);
    
    // Update UI
    updateWalletUI(walletData);
  } catch (error) {
    console.error('Error loading wallet data:', error);
    showError('Failed to load wallet data. Please try again later.');
  }
}

async function addMoneyToWallet(amount) {
  try {
    // Add money to wallet (using existing API for payment processing)
    const result = await SkillBetArena.addMoneyToWallet(amount);
    
    // Refresh wallet data
    const currentUser = await supabase.auth.getUser();
    const walletData = await getWallet(currentUser.data.user.id);
    
    // Update UI
    updateWalletUI(walletData);
    
    // Show success message
    showSuccess('Money added to wallet successfully!');
  } catch (error) {
    console.error('Error adding money to wallet:', error);
    showError('Failed to add money to wallet. Please try again later.');
  }
}
```

### 6. Games Page

#### Games JavaScript (games.js)

**Before (Firebase):**
```javascript
// Games page functionality
document.addEventListener('DOMContentLoaded', async () => {
  await loadGamesData();
});

async function loadGamesData() {
  try {
    // Fetch available games
    const games = await SkillBetArena.apiCall('/games', 'GET');
    
    // Update UI
    updateGamesUI(games);
  } catch (error) {
    console.error('Error loading games data:', error);
    showError('Failed to load games data. Please try again later.');
  }
}

async function joinContest(contestId) {
  try {
    // Join contest
    const result = await SkillBetArena.joinContest(contestId);
    
    // Show success message
    showSuccess('Successfully joined contest!');
  } catch (error) {
    console.error('Error joining contest:', error);
    showError('Failed to join contest. Please try again later.');
  }
}
```

**After (Supabase):**
```javascript
// Games page functionality
import { getContests, joinContest } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadGamesData();
});

async function loadGamesData() {
  try {
    // Fetch available games
    const games = await getContests();
    
    // Update UI
    updateGamesUI(games);
  } catch (error) {
    console.error('Error loading games data:', error);
    showError('Failed to load games data. Please try again later.');
  }
}

async function joinContest(contestId) {
  try {
    // Join contest
    const currentUser = await supabase.auth.getUser();
    const result = await joinContest(currentUser.data.user.id, contestId);
    
    // Show success message
    showSuccess('Successfully joined contest!');
  } catch (error) {
    console.error('Error joining contest:', error);
    showError('Failed to join contest. Please try again later.');
  }
}
```

### 7. Leaderboard Page

#### Leaderboard JavaScript (leaderboard.js)

**Before (Firebase):**
```javascript
// Leaderboard page functionality
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const contestId = urlParams.get('contestId');
  
  if (contestId) {
    await loadLeaderboardData(contestId);
  }
});

async function loadLeaderboardData(contestId) {
  try {
    // Fetch leaderboard data
    const leaderboard = await SkillBetArena.apiCall(`/contest/${contestId}/leaderboard`, 'GET');
    
    // Update UI
    updateLeaderboardUI(leaderboard.results);
  } catch (error) {
    console.error('Error loading leaderboard data:', error);
    showError('Failed to load leaderboard data. Please try again later.');
  }
}
```

**After (Supabase):**
```javascript
// Leaderboard page functionality
import { getLeaderboard } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const contestId = urlParams.get('contestId');
  
  if (contestId) {
    await loadLeaderboardData(contestId);
  }
});

async function loadLeaderboardData(contestId) {
  try {
    // Fetch leaderboard data
    const leaderboard = await getLeaderboard(contestId);
    
    // Update UI
    updateLeaderboardUI(leaderboard);
  } catch (error) {
    console.error('Error loading leaderboard data:', error);
    showError('Failed to load leaderboard data. Please try again later.');
  }
}
```

## Component Updates

### 1. Navigation Component

**Before (Firebase):**
```javascript
// Update navigation based on auth state
function updateNavigation() {
  const user = SkillBetArena.getCurrentUser();
  
  if (user && user.isAuthenticated) {
    // Show authenticated navigation
    document.querySelector('.nav-auth .user-profile').classList.remove('hidden');
    document.querySelector('.nav-auth #loginBtn').classList.add('hidden');
    document.querySelector('.nav-auth #signupBtn').classList.add('hidden');
  } else {
    // Show guest navigation
    document.querySelector('.nav-auth .user-profile').classList.add('hidden');
    document.querySelector('.nav-auth #loginBtn').classList.remove('hidden');
    document.querySelector('.nav-auth #signupBtn').classList.remove('hidden');
  }
}
```

**After (Supabase):**
```javascript
// Update navigation based on auth state
async function updateNavigation() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Show authenticated navigation
    document.querySelector('.nav-auth .user-profile').classList.remove('hidden');
    document.querySelector('.nav-auth #loginBtn').classList.add('hidden');
    document.querySelector('.nav-auth #signupBtn').classList.add('hidden');
    
    // Update user profile info
    const profile = await getUserProfile(user.id);
    if (profile) {
      document.querySelector('.user-profile .username').textContent = 
        profile.display_name || profile.email;
      
      // Update profile photo
      if (profile.photo_url) {
        document.querySelector('.user-profile .profile-pic').src = profile.photo_url;
      }
    }
  } else {
    // Show guest navigation
    document.querySelector('.nav-auth .user-profile').classList.add('hidden');
    document.querySelector('.nav-auth #loginBtn').classList.remove('hidden');
    document.querySelector('.nav-auth #signupBtn').classList.remove('hidden');
  }
}
```

### 2. Auth State Listener

**Before (Firebase):**
```javascript
// Listen for auth state changes
firebase.auth().onAuthStateChanged((user) => {
  updateNavigation();
  
  // Reload page data if needed
  if (window.location.pathname.includes('dashboard')) {
    loadDashboardData();
  }
});
```

**After (Supabase):**
```javascript
// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  updateNavigation();
  
  // Reload page data if needed
  if (window.location.pathname.includes('dashboard')) {
    loadDashboardData();
  }
});
```

## Utility Functions

### 1. File Upload Utility

**Before (Firebase):**
```javascript
// Upload file to Firebase Storage
async function uploadFile(file, path) {
  const storageRef = firebase.storage().ref(path);
  const uploadTask = storageRef.put(file);
  
  return new Promise((resolve, reject) => {
    uploadTask.then(async (snapshot) => {
      const downloadURL = await snapshot.ref.getDownloadURL();
      resolve(downloadURL);
    }).catch(reject);
  });
}
```

**After (Supabase):**
```javascript
// Upload file to Supabase Storage
async function uploadFile(file, path) {
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return publicUrl;
}
```

### 2. Real-time Updates

**Before (Firebase):**
```javascript
// Listen for real-time updates
function subscribeToContestUpdates(contestId, callback) {
  return firebase.firestore()
    .collection('contests')
    .doc(contestId)
    .onSnapshot((doc) => {
      callback(doc.data());
    });
}
```

**After (Supabase):**
```javascript
// Listen for real-time updates
function subscribeToContestUpdates(contestId, callback) {
  const channel = supabase
    .channel('contest-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'contests',
        filter: `id=eq.${contestId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}
```

## Testing

### 1. Authentication Flow Testing

```javascript
// Test authentication flow
describe('Authentication Flow', () => {
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
  
  test('should login existing user', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Test1234!'
    };
    
    const result = await loginUser(credentials);
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
  });
  
  test('should logout user', async () => {
    await logoutUser();
    const { data: { user } } = await supabase.auth.getUser();
    expect(user).toBeNull();
  });
});
```

### 2. Data Operations Testing

```javascript
// Test data operations
describe('Data Operations', () => {
  test('should fetch user profile', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const profile = await getUserProfile(user.id);
    expect(profile).toBeDefined();
    expect(profile.email).toBe(user.email);
  });
  
  test('should update user profile', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const updates = { display_name: 'Updated Name' };
    const updatedProfile = await updateUserProfile(user.id, updates);
    expect(updatedProfile.display_name).toBe('Updated Name');
  });
  
  test('should fetch wallet data', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const wallet = await getWallet(user.id);
    expect(wallet).toBeDefined();
    expect(wallet.user_id).toBe(user.id);
  });
});
```

## Migration Checklist

### 1. HTML Files
- [ ] Update script tags to use `type="module"`
- [ ] Import Supabase modules where needed
- [ ] Replace Firebase SDK calls with Supabase equivalents

### 2. JavaScript Files
- [ ] Replace Firebase authentication calls
- [ ] Replace Firestore database operations
- [ ] Replace Firebase Storage operations
- [ ] Update real-time listeners to use Supabase Channels
- [ ] Update error handling for Supabase-specific errors

### 3. Components
- [ ] Update navigation component for auth state
- [ ] Update profile photo component for storage
- [ ] Update real-time components for Channels
- [ ] Update form validation and submission

### 4. Utilities
- [ ] Replace file upload utilities
- [ ] Replace data fetching utilities
- [ ] Update caching mechanisms
- [ ] Update error handling utilities

### 5. Testing
- [ ] Update unit tests for new functions
- [ ] Update integration tests for data flows
- [ ] Add tests for real-time features
- [ ] Add tests for storage operations

## Best Practices

1. **Use ES Modules** - Modern browsers support ES modules natively
2. **Import only what you need** - Reduce bundle size with selective imports
3. **Handle async operations properly** - Use async/await consistently
4. **Implement proper error handling** - Catch and handle Supabase errors
5. **Use environment variables** - Store Supabase credentials securely
6. **Implement caching** - Cache frequently accessed data
7. **Use TypeScript** - Add type safety to your JavaScript code
8. **Follow security best practices** - Validate inputs and sanitize outputs
9. **Monitor performance** - Track load times and optimize as needed
10. **Test thoroughly** - Ensure all functionality works as expected

## Common Issues and Solutions

### 1. Module Import Errors

**Issue:** `SyntaxError: Cannot use import statement outside a module`

**Solution:** Add `type="module"` to script tags:
```html
<script type="module" src="./assets/js/main.js"></script>
```

### 2. CORS Errors

**Issue:** Cross-origin requests blocked

**Solution:** Configure Supabase URL whitelist in dashboard

### 3. Authentication State Issues

**Issue:** User state not updating properly

**Solution:** Use Supabase auth state change listener:
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
});
```

### 4. Real-time Connection Issues

**Issue:** Real-time updates not working

**Solution:** Check Supabase project settings and ensure real-time is enabled

## Support

For issues with frontend migration to Supabase:
- [Supabase JavaScript Documentation](https://supabase.com/docs/reference/javascript/start)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)