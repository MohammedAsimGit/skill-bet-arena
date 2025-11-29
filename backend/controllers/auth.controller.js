const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { signUpUser, loginUser: supabaseLogin, getUserById, updateUserProfile } = require('../utils/supabaseAuth');
const { insert, select, update } = require('../utils/supabaseDb');
const User = require('../models/user.model');

// Generate referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber, referredBy } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Create user in Supabase Authentication
    const { data: authData, error: authError } = await signUpUser(email, password, displayName);
    
    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Generate referral code
    const referralCode = generateReferralCode();

    // Create user record in Supabase database
    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      display_name: displayName || email.split('@')[0],
      phone_number: phoneNumber || '',
      photo_url: '',
      created_at: new Date(),
      last_login_at: new Date(),
      is_email_verified: authData.user.email_confirmed_at ? true : false,
      wallet_balance: 0,
      total_earnings: 0,
      games_played: 0,
      games_won: 0,
      win_rate: 0,
      referral_code: referralCode,
      referred_by: referredBy || '',
      subscription_type: 'free',
      subscription_expiry: null,
      device_fingerprint: '',
      is_banned: false
    };

    // Insert user into users table
    const userRecord = await insert('users', userData);

    // If user was referred, update referrer's data
    if (referredBy) {
      const referrerUsers = await select('users', { referral_code: referredBy }, { limit: 1 });

      if (referrerUsers.length > 0) {
        const referrer = referrerUsers[0];
        // Add referral bonus logic here if needed
        // For now, we'll just increment their referral count
        await insert('referrals', {
          referrer_id: referrer.id,
          referred_id: userRecord.id,
          created_at: new Date()
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { uid: userRecord.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.id,
        email: userRecord.email,
        displayName: userRecord.display_name,
        photoURL: userRecord.photo_url
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate user with Supabase Auth
    const { data: authData, error: authError } = await supabaseLogin(email, password);
    
    if (authError) {
      // Handle specific error cases
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({ 
          message: 'Please check your email and confirm your account before logging in. For development purposes, email confirmation can be disabled in Supabase settings.' 
        });
      }
      return res.status(401).json({ message: authError.message });
    }
    
    // Get user from database
    const userRecords = await select('users', { id: authData.user.id }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userRecord = userRecords[0];
    
    // Update last login time
    await update('users', { id: userRecord.id }, { last_login_at: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { uid: userRecord.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        uid: userRecord.id,
        email: userRecord.email,
        displayName: userRecord.display_name,
        photoURL: userRecord.photo_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get user from Supabase database
    const userRecords = await select('users', { id: userId }, { limit: 1 });
    
    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userRecords[0];
    
    // Convert to User model format
    const user = new User({
      uid: userData.id,
      email: userData.email,
      displayName: userData.display_name,
      phoneNumber: userData.phone_number,
      photoURL: userData.photo_url,
      createdAt: userData.created_at,
      lastLoginAt: userData.last_login_at,
      isEmailVerified: userData.is_email_verified,
      walletBalance: userData.wallet_balance,
      totalEarnings: userData.total_earnings,
      gamesPlayed: userData.games_played,
      gamesWon: userData.games_won,
      winRate: userData.win_rate,
      referralCode: userData.referral_code,
      referredBy: userData.referred_by,
      subscriptionType: userData.subscription_type,
      subscriptionExpiry: userData.subscription_expiry,
      deviceFingerprint: userData.device_fingerprint,
      isBanned: userData.is_banned
    });
    
    res.status(200).json({
      user: user.toObject()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error while fetching profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, phoneNumber, photoURL } = req.body;
    
    // Update user in Supabase database
    const updateData = {};
    if (displayName) updateData.display_name = displayName;
    if (phoneNumber) updateData.phone_number = phoneNumber;
    if (photoURL) updateData.photo_url = photoURL;
    
    await update('users', { id: userId }, updateData);
    
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error while updating profile' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};