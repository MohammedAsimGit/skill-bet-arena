const { select, getResults } = require('../utils/supabaseDb');
const Leaderboard = require('../models/leaderboard.model');

// Get global leaderboard
const getGlobalLeaderboard = async (req, res) => {
  try {
    const { gameType, limit = 50 } = req.query;
    
    // Build filters
    const filters = {};
    if (gameType) filters.game_type = gameType;
    
    // Get leaderboards
    const leaderboardData = await select('leaderboards', filters, { 
      orderBy: 'updated_at', 
      ascending: false, 
      limit: 1 
    });
    
    if (leaderboardData.length === 0) {
      return res.status(404).json({ message: 'Leaderboard not found' });
    }
    
    const leaderboardRecord = leaderboardData[0];
    const leaderboard = new Leaderboard({
      leaderboardId: leaderboardRecord.id,
      ...leaderboardRecord
    });
    
    // Get top entries
    const topEntries = leaderboard.getTopEntries(parseInt(limit));
    
    res.status(200).json({
      leaderboard: {
        ...leaderboard.toObject(),
        entries: topEntries
      }
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error while fetching leaderboard' });
  }
};

// Get user rank in leaderboard
const getUserRank = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { leaderboardId } = req.params;
    
    const leaderboardData = await select('leaderboards', { id: leaderboardId }, { limit: 1 });
    
    if (leaderboardData.length === 0) {
      return res.status(404).json({ message: 'Leaderboard not found' });
    }
    
    const leaderboardRecord = leaderboardData[0];
    const leaderboard = new Leaderboard({
      leaderboardId: leaderboardRecord.id,
      ...leaderboardRecord
    });
    const rank = leaderboard.getUserRank(userId);
    
    if (rank === null) {
      return res.status(404).json({ message: 'User not found in leaderboard' });
    }
    
    res.status(200).json({ rank });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ message: 'Internal server error while fetching user rank' });
  }
};

// Get user's performance history
const getUserPerformance = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user's contest results
    const results = await getResults(userId, 50);
    
    res.status(200).json({ results });
  } catch (error) {
    console.error('Get user performance error:', error);
    res.status(500).json({ message: 'Internal server error while fetching performance data' });
  }
};

module.exports = {
  getGlobalLeaderboard,
  getUserRank,
  getUserPerformance
};