// DOM Elements (only initialize if they exist)
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfile = document.querySelector('.user-profile');
const playNowBtn = document.getElementById('playNowBtn');
const viewTournamentsBtn = document.getElementById('viewTournamentsBtn');
const featuresSection = document.getElementById('featuresSection');
const howItWorksSection = document.getElementById('howItWorksSection');
const footerSection = document.getElementById('footerSection');
// Navigation links to show/hide for authenticated users
const gamesLink = document.getElementById('gamesLink');
const leaderboardLink = document.getElementById('leaderboardLink');
const walletLink = document.getElementById('walletLink');
const footerGamesLink = document.getElementById('footerGamesLink');
const footerLeaderboardLink = document.getElementById('footerLeaderboardLink');
const footerWalletLink = document.getElementById('footerWalletLink');

// Toggle mobile menu (only if elements exist)
if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Login functionality (only if element exists)
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        // Redirect to login page
        window.location.href = 'pages/login.html';
    });
}

// Signup functionality (only if element exists)
if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        // Redirect to signup page
        window.location.href = 'pages/signup.html';
    });
}

// Play Now button functionality
if (playNowBtn) {
    playNowBtn.addEventListener('click', () => {
        // Check if user is authenticated
        SkillBetArena.getCurrentUser().then(user => {
            if (user && user.isAuthenticated) {
                // User is logged in, go to games page
                window.location.href = 'pages/games.html';
            } else {
                // User is not logged in, go to signup
                window.location.href = 'pages/signup.html';
            }
        }).catch(() => {
            // Error checking auth status, go to signup
            window.location.href = 'pages/signup.html';
        });
    });
}

// View Tournaments button functionality
if (viewTournamentsBtn) {
    viewTournamentsBtn.addEventListener('click', () => {
        // Check if user is authenticated
        SkillBetArena.getCurrentUser().then(user => {
            if (user && user.isAuthenticated) {
                // User is logged in, go to games page
                window.location.href = 'pages/games.html';
            } else {
                // User is not logged in, go to signup
                window.location.href = 'pages/signup.html';
            }
        }).catch(() => {
            // Error checking auth status, go to signup
            window.location.href = 'pages/signup.html';
        });
    });
}

// Logout functionality (only if element exists)
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed. Please try again.');
        }
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Form validation helper
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

// API base URL (in a real app, this would be your backend URL)
const API_BASE_URL = 'http://localhost:5000/api';

// Import Supabase functions
import { registerUser as supabaseRegister, loginUser as supabaseLogin, logoutUser as supabaseLogout, getCurrentUser as supabaseGetCurrentUser } from './auth.js';

// Utility functions for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    console.log('Making API call to:', url, options);
    
    try {
        const response = await fetch(url, options);
        console.log('Response status:', response.status);
        
        // Handle network errors
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                // If we can't parse the error response, use the status text
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('API call successful:', result);
        return result;
    } catch (error) {
        console.error('API call error:', error);
        // Provide more specific error messages
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Unable to connect to the server. Please make sure the backend is running.');
        }
        throw error;
    }
}

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
        // Redirect to welcome page
        window.location.href = 'welcome.html';
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

// Wallet functions
async function getWallet() {
    try {
        const result = await apiCall('/wallet', 'GET');
        return result.wallet;
    } catch (error) {
        throw error;
    }
}

async function addMoneyToWallet(amount) {
    try {
        const result = await apiCall('/wallet/add', 'POST', { amount });
        return result;
    } catch (error) {
        throw error;
    }
}

// Contest functions
async function getContests() {
    try {
        const result = await apiCall('/contest', 'GET');
        return result.contests;
    } catch (error) {
        throw error;
    }
}

async function joinContest(contestId) {
    try {
        const result = await apiCall(`/contest/${contestId}/join`, 'POST');
        return result;
    } catch (error) {
        throw error;
    }
}

// Check if user is authenticated and show/hide content accordingly
async function checkAuthAndToggleContent() {
    try {
        const user = await getCurrentUser();
        
        if (user && user.isAuthenticated) {
            // User is authenticated, show navigation links
            if (gamesLink) gamesLink.classList.remove('hidden');
            if (leaderboardLink) leaderboardLink.classList.remove('hidden');
            if (walletLink) walletLink.classList.remove('hidden');
            if (footerGamesLink) footerGamesLink.classList.remove('hidden');
            if (footerLeaderboardLink) footerLeaderboardLink.classList.remove('hidden');
            if (footerWalletLink) footerWalletLink.classList.remove('hidden');
            
            // Update user profile display
            await updateUserProfileDisplay();
        } else {
            // User is not authenticated, keep navigation links hidden
            // Navigation links are already hidden by default
            await updateUserProfileDisplay();
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
    }
}

// Update user profile display
async function updateUserProfileDisplay() {
    try {
        const user = await getCurrentUser();
        
        if (user && user.isAuthenticated) {
            // Show user profile, hide login/signup buttons
            if (userProfile) {
                userProfile.classList.remove('hidden');
                // Update user name in profile dropdown
                const usernameSpan = userProfile.querySelector('.username');
                if (usernameSpan) {
                    usernameSpan.textContent = user.user_metadata?.display_name || user.email || 'User';
                }
                
                // Update profile picture if available
                const profilePic = userProfile.querySelector('.profile-pic');
                if (profilePic && user.user_metadata?.photo_url) {
                    profilePic.src = user.user_metadata.photo_url;
                }
            }
            
            if (loginBtn) loginBtn.classList.add('hidden');
            if (signupBtn) signupBtn.classList.add('hidden');
        } else {
            // Hide user profile, show login/signup buttons
            if (userProfile) userProfile.classList.add('hidden');
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (signupBtn) signupBtn.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error updating user profile display:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status and toggle content visibility
    await checkAuthAndToggleContent();
    
    // Add any other initialization code here
    console.log('SkillBet Arena App Initialized');
});

// Export functions for use in other modules
// Use a try-catch to ensure SkillBetArena is always defined
try {
    window.SkillBetArena = {
        apiCall,
        registerUser,
        loginUser,
        logoutUser,
        getCurrentUser,
        getWallet,
        addMoneyToWallet,
        getContests,
        joinContest,
        validateEmail,
        validatePassword,
        updateUserProfileDisplay,
        checkAuthAndToggleContent
    };
} catch (error) {
    console.error('Error defining SkillBetArena object:', error);
    // Fallback to ensure the object exists
    if (!window.SkillBetArena) {
        window.SkillBetArena = {
            apiCall: apiCall || function() { throw new Error('apiCall not available'); },
            registerUser: registerUser || function() { throw new Error('registerUser not available'); },
            loginUser: loginUser || function() { throw new Error('loginUser not available'); },
            logoutUser: logoutUser || function() { throw new Error('logoutUser not available'); },
            getCurrentUser: getCurrentUser || function() { return null; },
            getWallet: getWallet || function() { throw new Error('getWallet not available'); },
            addMoneyToWallet: addMoneyToWallet || function() { throw new Error('addMoneyToWallet not available'); },
            getContests: getContests || function() { throw new Error('getContests not available'); },
            joinContest: joinContest || function() { throw new Error('joinContest not available'); },
            validateEmail: validateEmail || function() { return false; },
            validatePassword: validatePassword || function() { return false; },
            updateUserProfileDisplay: updateUserProfileDisplay || function() {},
            checkAuthAndToggleContent: checkAuthAndToggleContent || function() {}
        };
    }
}