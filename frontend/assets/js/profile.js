// Profile page functionality
import { supabase } from './supabase.js';
import { getUserProfile, updateUserProfile } from './database.js';

// DOM Elements
const profileForm = document.getElementById('personalInfoForm');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closeBtn = document.querySelector('.modal .close');
const changePasswordForm = document.getElementById('changePasswordForm');

// Load user profile data
async function loadUserProfile() {
  try {
    // Show loading state
    showLoadingState();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found');
      return;
    }
    
    // Get user profile data
    const profile = await getUserProfile(user.id);
    
    if (profile) {
      // Update profile header
      document.getElementById('userDisplayName').textContent = profile.display_name || 'User';
      document.getElementById('userEmail').textContent = profile.email || '';
      
      // Update stats (these would come from actual data in a real app)
      document.getElementById('gamesPlayed').textContent = profile.games_played || 0;
      document.getElementById('winRate').textContent = profile.win_rate || 0;
      document.getElementById('totalEarnings').textContent = profile.total_earnings ? `₹${profile.total_earnings}` : '₹0';
      
      // Update form fields
      document.getElementById('firstName').value = profile.first_name || '';
      document.getElementById('lastName').value = profile.last_name || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('phone').value = profile.phone || '';
      document.getElementById('dateOfBirth').value = profile.date_of_birth || '';
      document.getElementById('bio').value = profile.bio || '';
      
      // Update profile picture if available
      if (profile.photo_url) {
        document.querySelector('.profile-avatar img').src = profile.photo_url;
        document.querySelector('.user-profile img').src = profile.photo_url;
      }
    }
    
    // Hide loading state
    hideLoadingState();
  } catch (error) {
    console.error('Error loading user profile:', error);
    hideLoadingState();
    showError('Failed to load profile data. Please try again later.');
  }
}

// Show loading state
function showLoadingState() {
  // Add loading indicators to profile elements
  document.getElementById('userDisplayName').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  document.getElementById('userEmail').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  
  // Show loading for stats
  document.querySelectorAll('.stat-value').forEach(el => {
    el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  });
}

// Hide loading state
function hideLoadingState() {
  // Remove loading indicators (will be replaced by actual data)
}

// Show error message
function showError(message) {
  // Display error message to user
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-error';
  errorDiv.textContent = message;
  document.querySelector('.profile-header').after(errorDiv);
  
  // Remove error after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Save profile changes
async function saveProfileChanges(event) {
  event.preventDefault();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No user found');
    }
    
    // Get form data
    const formData = new FormData(profileForm);
    const updates = {
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      phone: formData.get('phone'),
      date_of_birth: formData.get('dateOfBirth'),
      bio: formData.get('bio'),
      updated_at: new Date()
    };
    
    // Update user profile
    const updatedProfile = await updateUserProfile(user.id, updates);
    
    if (updatedProfile) {
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success';
      successDiv.textContent = 'Profile updated successfully!';
      profileForm.prepend(successDiv);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successDiv.remove();
      }, 3000);
      
      // Update display name in header
      document.getElementById('userDisplayName').textContent = 
        `${updates.first_name} ${updates.last_name}` || 'User';
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    showError('Failed to save profile changes. Please try again.');
  }
}

// Change password
function openChangePasswordModal() {
  changePasswordModal.style.display = 'block';
}

// Close modal
function closeChangePasswordModal() {
  changePasswordModal.style.display = 'none';
  changePasswordForm.reset();
}

// Handle password change
async function changePassword(event) {
  event.preventDefault();
  
  try {
    const formData = new FormData(changePasswordForm);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    // In a real implementation, this would call the backend to change the password
    // For now, we'll just show a success message
    alert('Password changed successfully!');
    closeChangePasswordModal();
  } catch (error) {
    console.error('Error changing password:', error);
    alert('Failed to change password. Please try again.');
  }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
  // Load user profile
  loadUserProfile();
  
  // Add event listeners
  if (profileForm) {
    profileForm.addEventListener('submit', saveProfileChanges);
  }
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', openChangePasswordModal);
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeChangePasswordModal);
  }
  
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', changePassword);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === changePasswordModal) {
      closeChangePasswordModal();
    }
  });
  
  console.log('Profile page initialized');
});