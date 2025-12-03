// Profile management functions using Supabase
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

// Fetch user profile data from Supabase
async function fetchUserProfile() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    // Fetch user data from the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Update user profile data
async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Format currency values
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Check if subscription is active
function isSubscriptionActive(expiryDate) {
  if (!expiryDate) return false;
  return new Date(expiryDate) > new Date();
}

// Get subscription badge class
function getSubscriptionBadgeClass(subscriptionType) {
  switch (subscriptionType) {
    case 'gold':
      return 'gold';
    case 'elite':
      return 'elite';
    default:
      return 'free';
  }
}

// Get subscription display name
function getSubscriptionDisplayName(subscriptionType) {
  switch (subscriptionType) {
    case 'gold':
      return 'Gold Pass';
    case 'elite':
      return 'Elite Pass';
    default:
      return 'Free Account';
  }
}

// Populate profile page with user data
async function populateProfilePage() {
  try {
    // Show loading state
    document.getElementById('profileUsername').textContent = 'Loading...';
    document.getElementById('profileEmail').textContent = 'Loading...';
    document.getElementById('topNavUsername').textContent = 'Loading...';
    
    // Fetch user profile data
    const userProfile = await fetchUserProfile();
    
    // Update profile avatar (use default if no photo_url)
    const avatarUrl = userProfile.photo_url || '../assets/images/default-avatar.png';
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('topNavAvatar').src = avatarUrl;
    
    // Update username
    const displayName = userProfile.display_name || 'Anonymous Player';
    document.getElementById('profileUsername').textContent = displayName;
    document.getElementById('topNavUsername').textContent = displayName;
    
    // Update email
    document.getElementById('profileEmail').textContent = userProfile.email;
    
    // Update stats
    document.getElementById('gamesPlayed').textContent = userProfile.games_played || 0;
    document.getElementById('winRate').textContent = `${userProfile.win_rate || 0}%`;
    document.getElementById('totalEarnings').textContent = formatCurrency(userProfile.total_earnings || 0);
    document.getElementById('topNavPoints').textContent = `${Math.floor(userProfile.wallet_balance || 0)} pts`;
    
    // Update subscription info
    const subscriptionBadge = document.querySelector('#subscriptionInfo .badge');
    const subscriptionExpiry = document.getElementById('subscriptionExpiry');
    
    const subscriptionType = userProfile.subscription_type || 'free';
    const subscriptionDisplayName = getSubscriptionDisplayName(subscriptionType);
    const subscriptionBadgeClass = getSubscriptionBadgeClass(subscriptionType);
    
    subscriptionBadge.textContent = subscriptionDisplayName;
    subscriptionBadge.className = `badge ${subscriptionBadgeClass}`;
    
    if (userProfile.subscription_expiry && isSubscriptionActive(userProfile.subscription_expiry)) {
      subscriptionExpiry.textContent = `Expires: ${formatDate(userProfile.subscription_expiry)}`;
    } else {
      subscriptionExpiry.textContent = 'Expires: N/A';
    }
    
  } catch (error) {
    console.error('Error populating profile page:', error);
    // Show error state
    document.getElementById('profileUsername').textContent = 'Error loading profile';
    document.getElementById('profileEmail').textContent = 'Please try again later';
  }
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  populateProfilePage();
});

export {
  fetchUserProfile,
  updateUserProfile,
  formatCurrency,
  formatDate,
  isSubscriptionActive,
  getSubscriptionBadgeClass,
  getSubscriptionDisplayName
};