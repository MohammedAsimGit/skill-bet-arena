// Leaderboard page functionality
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';
import { formatCurrency } from './profile.js';

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

// Function to fetch and display leaderboard data
async function loadLeaderboardData() {
  try {
    // Fetch top 10 players from the leaderboard
    const { data: leaderboard, error } = await supabase
      .from('leaderboards')
      .select('*, users(display_name, photo_url)')
      .order('points', { ascending: false })
      .limit(10);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Update the leaderboard display
    if (leaderboard.length > 0) {
      // Update top 3 players
      if (leaderboard[0]) {
        document.getElementById('firstPlaceName').textContent = leaderboard[0].users?.display_name || 'Anonymous';
        document.getElementById('firstPlacePoints').textContent = `${leaderboard[0].points} pts`;
        if (leaderboard[0].users?.photo_url) {
          document.getElementById('firstPlaceAvatar').src = leaderboard[0].users.photo_url;
        }
      }
      
      if (leaderboard[1]) {
        document.getElementById('secondPlaceName').textContent = leaderboard[1].users?.display_name || 'Anonymous';
        document.getElementById('secondPlacePoints').textContent = `${leaderboard[1].points} pts`;
        if (leaderboard[1].users?.photo_url) {
          document.getElementById('secondPlaceAvatar').src = leaderboard[1].users.photo_url;
        }
      }
      
      if (leaderboard[2]) {
        document.getElementById('thirdPlaceName').textContent = leaderboard[2].users?.display_name || 'Anonymous';
        document.getElementById('thirdPlacePoints').textContent = `${leaderboard[2].points} pts`;
        if (leaderboard[2].users?.photo_url) {
          document.getElementById('thirdPlaceAvatar').src = leaderboard[2].users.photo_url;
        }
      }
      
      // Update positions 4-10
      for (let i = 3; i < Math.min(10, leaderboard.length); i++) {
        const position = i + 1;
        const placeId = getPlaceId(position);
        
        if (placeId.nameId && leaderboard[i]) {
          document.getElementById(placeId.nameId).textContent = leaderboard[i].users?.display_name || 'Anonymous';
          document.getElementById(placeId.pointsId).textContent = `${leaderboard[i].points} pts`;
          if (leaderboard[i].users?.photo_url) {
            document.getElementById(placeId.avatarId).src = leaderboard[i].users.photo_url;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading leaderboard data:', error);
  }
}

// Helper function to get element IDs for positions 4-10
function getPlaceId(position) {
  switch (position) {
    case 4: return { nameId: 'fourthPlaceName', pointsId: 'fourthPlacePoints', avatarId: 'fourthPlaceAvatar' };
    case 5: return { nameId: 'fifthPlaceName', pointsId: 'fifthPlacePoints', avatarId: 'fifthPlaceAvatar' };
    case 6: return { nameId: 'sixthPlaceName', pointsId: 'sixthPlacePoints', avatarId: 'sixthPlaceAvatar' };
    case 7: return { nameId: 'seventhPlaceName', pointsId: 'seventhPlacePoints', avatarId: 'seventhPlaceAvatar' };
    case 8: return { nameId: 'eighthPlaceName', pointsId: 'eighthPlacePoints', avatarId: 'eighthPlaceAvatar' };
    case 9: return { nameId: 'ninthPlaceName', pointsId: 'ninthPlacePoints', avatarId: 'ninthPlaceAvatar' };
    case 10: return { nameId: 'tenthPlaceName', pointsId: 'tenthPlacePoints', avatarId: 'tenthPlaceAvatar' };
    default: return {};
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Update navbar with real user data
  await updateNavbarProfile();
  
  // Load leaderboard data
  await loadLeaderboardData();
});