// Database functions using Supabase
import { supabase } from './supabase.js';

// Get user profile
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

// Update user profile
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
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

// Get user wallet
async function getWallet(userId) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to get wallet: ${error.message}`);
  }
}

// Get user transactions
async function getTransactions(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to get transactions: ${error.message}`);
  }
}

// Get contests
async function getContests(filters = {}) {
  try {
    let query = supabase
      .from('contests')
      .select('*')
      .order('start_time', { ascending: true });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.game_type) {
      query = query.eq('game_type', filters.game_type);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to get contests: ${error.message}`);
  }
}

// Get contest by ID
async function getContestById(contestId) {
  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to get contest: ${error.message}`);
  }
}

// Join contest
async function joinContest(userId, contestId) {
  try {
    // Add user to contest participants
    const { data, error } = await supabase
      .from('contest_participants')
      .insert({
        contest_id: contestId,
        user_id: userId,
        joined_at: new Date()
      });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to join contest: ${error.message}`);
  }
}

// Get leaderboard
async function getLeaderboard(contestId, limit = 100) {
  try {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        users(display_name, photo_url)
      `)
      .eq('contest_id', contestId)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }
}

// Submit game result
async function submitGameResult(resultData) {
  try {
    const { data, error } = await supabase
      .from('results')
      .insert(resultData);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to submit result: ${error.message}`);
  }
}

export {
  getUserProfile,
  updateUserProfile,
  getWallet,
  getTransactions,
  getContests,
  getContestById,
  joinContest,
  getLeaderboard,
  submitGameResult
};