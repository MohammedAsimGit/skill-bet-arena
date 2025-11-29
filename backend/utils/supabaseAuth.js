const { supabase } = require('./supabase');

// Sign up a new user
async function signUpUser(email, password, displayName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        },
        emailRedirectTo: 'http://localhost:3000/pages/dashboard.html' // Redirect after confirmation
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Handle email not confirmed error
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before logging in.');
      }
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

// Logout user
async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { message: 'Logged out successfully' };
  } catch (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

// Get user by ID
async function getUserById(userId) {
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
    throw new Error(`Failed to get user: ${error.message}`);
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
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

module.exports = {
  signUpUser,
  loginUser,
  logoutUser,
  getUserById,
  updateUserProfile
};