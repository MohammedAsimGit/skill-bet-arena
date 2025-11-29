const { select, update } = require('../utils/supabaseDb');
const User = require('../models/user.model');

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user from database
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userRecords[0];
    const user = new User({
      uid: userData.id,
      ...userData
    });
    
    // Calculate win rate
    const winRate = user.gamesPlayed > 0 ? user.gamesWon / user.gamesPlayed : 0;
    
    // Get recent transactions
    const recentTransactions = await select('transactions', 
      { user_id: userId }, 
      { orderBy: 'created_at', ascending: false, limit: 5 }
    );
    
    // Get recent game results
    const recentResults = await select('results', 
      { user_id: userId }, 
      { orderBy: 'created_at', ascending: false, limit: 5 }
    );
    
    res.status(200).json({
      stats: {
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        winRate: winRate,
        totalEarnings: user.totalEarnings,
        subscriptionType: user.subscriptionType,
        subscriptionExpiry: user.subscriptionExpiry
      },
      recentTransactions,
      recentResults
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Internal server error while fetching user stats' });
  }
};

// Get user profile with additional details
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user from database
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userRecords[0];
    const user = new User({
      uid: userData.id,
      ...userData
    });
    
    res.status(200).json({
      user: user.toObject()
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error while fetching user profile' });
  }
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { theme, notifications } = req.body;
    
    // Update user preferences in database
    const updateData = {};
    if (theme) updateData.theme = theme;
    if (notifications !== undefined) updateData.notifications = notifications;
    updateData.updated_at = new Date();
    
    await update('users', { id: userId }, updateData);
    
    res.status(200).json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Internal server error while updating preferences' });
  }
};

module.exports = {
  getUserStats,
  getUserProfile,
  updateUserPreferences
};