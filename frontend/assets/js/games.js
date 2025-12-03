// Games page functionality
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

// Function to update user profile data in the navbar
async function updateNavbarProfile() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return;
    }
    
    // Fetch user data from the users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Update navbar profile elements
    const topNavUsername = document.getElementById('topNavUsername');
    const topNavPoints = document.getElementById('topNavPoints');
    const topNavAvatar = document.getElementById('topNavAvatar');
    
    if (topNavUsername) {
      topNavUsername.textContent = userProfile.display_name || 'Player';
    }
    
    if (topNavPoints) {
      topNavPoints.textContent = `${Math.floor(userProfile.wallet_balance || 0)} pts`;
    }
    
    if (topNavAvatar && userProfile.photo_url) {
      topNavAvatar.src = userProfile.photo_url;
    }
  } catch (error) {
    console.error('Error updating navbar profile:', error);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Update navbar with real user data
  await updateNavbarProfile();
});