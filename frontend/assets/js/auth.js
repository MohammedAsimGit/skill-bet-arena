// Authentication functions using Supabase
import { supabase } from './supabase.js';

// Register new user
async function registerUser(userData) {
  try {
    const { email, password, displayName } = userData;
    
    // First, check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    // If user exists, throw a specific error
    if (existingUser) {
      throw new Error('This account already exists. Please login instead.');
    }
    
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
    
    if (error) {
      // Check if it's a duplicate user error
      if (error.message.includes('already been registered')) {
        throw new Error('This account already exists. Please login instead.');
      }
      throw new Error(error.message);
    }
    
    // Store additional user data in the database
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
          created_at: new Date()
        });
      
      if (insertError) {
        // If it's a duplicate key error, user already exists
        if (insertError.code === '23505') { // PostgreSQL duplicate key error
          throw new Error('This account already exists. Please login instead.');
        }
        throw new Error(insertError.message);
      }
    }
    
    return data;
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

// Login user
async function loginUser(credentials) {
  try {
    const { email, password } = credentials;
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      // Handle specific error cases
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

// Get current user
async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Listen for auth state changes
function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );
  
  return subscription;
}

// Resend confirmation email
async function resendConfirmationEmail(email) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { message: 'Confirmation email sent successfully. Please check your inbox.' };
  } catch (error) {
    throw new Error(`Failed to resend confirmation email: ${error.message}`);
  }
}

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  onAuthStateChange,
  resendConfirmationEmail
}