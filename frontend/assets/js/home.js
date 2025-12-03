// Home page functionality
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

// Function to update the welcome banner with user's name
async function updateWelcomeBanner() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return;
    }
    
    // Fetch user data from the users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Update welcome banner
    const welcomeUsernameElement = document.getElementById('welcomeUsername');
    if (welcomeUsernameElement) {
      welcomeUsernameElement.textContent = userProfile.display_name || 'Player';
    }
  } catch (error) {
    console.error('Error updating welcome banner:', error);
  }
}

// Function to update hero section stats
async function updateHeroStats() {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return;
    }
    
    // Fetch user data from the users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('wallet_balance, games_won, win_rate')
      .eq('id', user.id)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Update hero stats
    const heroWalletBalanceElement = document.getElementById('heroWalletBalance');
    if (heroWalletBalanceElement) {
      heroWalletBalanceElement.textContent = formatCurrency(userProfile.wallet_balance || 0);
    }
    
    const heroGamesWonElement = document.getElementById('heroGamesWon');
    if (heroGamesWonElement) {
      heroGamesWonElement.textContent = `${userProfile.games_won || 0} Wins`;
    }
    
    const heroWinRateElement = document.getElementById('heroWinRate');
    if (heroWinRateElement) {
      const winRate = userProfile.win_rate || 0;
      heroWinRateElement.textContent = `${winRate}% Win Rate`;
    }
  } catch (error) {
    console.error('Error updating hero stats:', error);
  }
}

// Function to fetch and display leaderboard data in the home page
async function updateHomePageLeaderboard() {
  try {
    // Fetch top 3 players from the leaderboard
    const { data: leaderboard, error } = await supabase
      .from('leaderboards')
      .select('*, users(display_name, photo_url)')
      .order('points', { ascending: false })
      .limit(3);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Update the leaderboard display
    if (leaderboard.length > 0) {
      // Update first place
      if (leaderboard[0]) {
        document.getElementById('leaderboardFirstName').textContent = leaderboard[0].users?.display_name || 'Anonymous';
        document.getElementById('leaderboardFirstPoints').textContent = `${leaderboard[0].points} pts`;
        if (leaderboard[0].users?.photo_url) {
          document.getElementById('leaderboardFirstAvatar').src = leaderboard[0].users.photo_url;
        }
      }
      
      // Update second place
      if (leaderboard[1]) {
        document.getElementById('leaderboardSecondName').textContent = leaderboard[1].users?.display_name || 'Anonymous';
        document.getElementById('leaderboardSecondPoints').textContent = `${leaderboard[1].points} pts`;
        if (leaderboard[1].users?.photo_url) {
          document.getElementById('leaderboardSecondAvatar').src = leaderboard[1].users.photo_url;
        }
      }
      
      // Update third place
      if (leaderboard[2]) {
        document.getElementById('leaderboardThirdName').textContent = leaderboard[2].users?.display_name || 'Anonymous';
        document.getElementById('leaderboardThirdPoints').textContent = `${leaderboard[2].points} pts`;
        if (leaderboard[2].users?.photo_url) {
          document.getElementById('leaderboardThirdAvatar').src = leaderboard[2].users.photo_url;
        }
      }
    }
  } catch (error) {
    console.error('Error updating home page leaderboard:', error);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Update navbar with real user data
  await updateNavbarProfile();
  
  // Update welcome banner
  await updateWelcomeBanner();
  
  // Update hero stats
  await updateHeroStats();
  
  // Update home page leaderboard
  await updateHomePageLeaderboard();
});