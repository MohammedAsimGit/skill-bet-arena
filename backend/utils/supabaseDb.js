const { supabase } = require('./supabase');

// Generic database operations
async function insert(table, data) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }
}

async function select(table, filters = {}, options = {}) {
  try {
    let query = supabase.from(table).select(options.columns || '*');

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (Array.isArray(filters[key])) {
        query = query.in(key, filters[key]);
      } else {
        query = query.eq(key, filters[key]);
      }
    });

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.ascending !== false 
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Select failed: ${error.message}`);
  }
}

async function update(table, filters, data) {
  try {
    let query = supabase.from(table).update(data);

    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });

    const { data: result, error } = await query.select().single();

    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    throw new Error(`Update failed: ${error.message}`);
  }
}

async function remove(table, filters) {
  try {
    let query = supabase.from(table);

    // Apply filters
    Object.keys(filters).forEach(key => {
      query = query.eq(key, filters[key]);
    });

    const { data, error } = await query.delete();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

// Specific operations for common entities
async function getWallet(userId) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to get wallet: ${error.message}`);
  }
}

async function updateWallet(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to update wallet: ${error.message}`);
  }
}

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

async function getResults(contestId, limit = 100) {
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
    throw new Error(`Failed to get results: ${error.message}`);
  }
}

module.exports = {
  insert,
  select,
  update,
  remove,
  getWallet,
  updateWallet,
  getTransactions,
  getContests,
  getContestById,
  getResults
};