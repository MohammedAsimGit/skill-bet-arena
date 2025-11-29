# Supabase Storage Implementation Guide

This guide details how to replace Firebase Storage with Supabase Storage for profile photos and other assets in the SkillBet Arena application.

## Overview

Supabase Storage provides a robust file storage solution with features including:
- Public and private file storage
- Automatic content-type detection
- File resizing and transformation
- Access control through RLS policies
- CDN integration for fast delivery

## Backend Implementation

### 1. Storage Utilities

The `backend/utils/supabaseStorage.js` file provides helper functions for storage operations:

```javascript
const { supabase } = require('./supabase');

// Upload file to Supabase Storage
async function uploadFile(bucketName, fileName, fileBuffer, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: true // Overwrite if file exists
      });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
}

// Get public URL for a file
function getFileUrl(bucketName, fileName) {
  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    throw new Error(`Failed to get file URL: ${error.message}`);
  }
}

// Delete file from storage
async function deleteFile(bucketName, fileName) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

// List files in a bucket
async function listFiles(bucketName, options = {}) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(options.path, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: 'name', order: 'asc' }
      });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

// Create signed URL for private files
async function createSignedUrl(bucketName, fileName, expiresIn = 60) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, expiresIn);

    if (error) {
      throw new Error(error.message);
    }

    return data.signedUrl;
  } catch (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
}

module.exports = {
  uploadFile,
  getFileUrl,
  deleteFile,
  listFiles,
  createSignedUrl
};
```

### 2. Profile Photo Controller

Create a controller to handle profile photo operations:

```javascript
// backend/controllers/profile.controller.js
const { uploadFile, getFileUrl, deleteFile } = require('../utils/supabaseStorage');
const { update } = require('../utils/supabaseDb');

// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.uid;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPEG, PNG, and GIF files are allowed.' 
      });
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
    
    // Generate file name
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}/profile.${fileExtension}`;
    
    // Upload file to Supabase Storage
    const uploadResult = await uploadFile(
      'avatars', 
      fileName, 
      file.buffer, 
      file.mimetype
    );
    
    // Get public URL
    const photoUrl = getFileUrl('avatars', fileName);
    
    // Update user profile with new photo URL
    await update('users', { id: userId }, { photo_url: photoUrl });
    
    res.status(200).json({
      message: 'Profile photo uploaded successfully',
      photoUrl
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ 
      message: 'Failed to upload profile photo' 
    });
  }
};

// Delete profile photo
const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get current user to check if they have a photo
    const users = await select('users', { id: userId }, { limit: 1 });
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    if (!user.photo_url) {
      return res.status(400).json({ message: 'No profile photo to delete' });
    }
    
    // Extract file name from URL
    const urlParts = user.photo_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${userId}/${fileName}`;
    
    // Delete file from storage
    await deleteFile('avatars', filePath);
    
    // Update user profile to remove photo URL
    await update('users', { id: userId }, { photo_url: null });
    
    res.status(200).json({
      message: 'Profile photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ 
      message: 'Failed to delete profile photo' 
    });
  }
};

// Get profile photo URL
const getProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user profile
    const users = await select('users', { id: userId }, { limit: 1 });
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    if (!user.photo_url) {
      return res.status(404).json({ message: 'No profile photo found' });
    }
    
    res.status(200).json({
      photoUrl: user.photo_url
    });
  } catch (error) {
    console.error('Get profile photo error:', error);
    res.status(500).json({ 
      message: 'Failed to get profile photo' 
    });
  }
};

module.exports = {
  uploadProfilePhoto,
  deleteProfilePhoto,
  getProfilePhoto
};
```

### 3. File Upload Middleware

Create middleware to handle file uploads:

```javascript
// backend/middleware/upload.middleware.js
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Single file upload middleware
const uploadSingle = upload.single('photo');

module.exports = {
  uploadSingle
};
```

### 4. Profile Routes

Add routes for profile photo operations:

```javascript
// backend/routes/profile.routes.js
const express = require('express');
const { 
  uploadProfilePhoto,
  deleteProfilePhoto,
  getProfilePhoto
} = require('../controllers/profile.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

const router = express.Router();

// Protected routes
router.post('/photo', authenticateToken, uploadSingle, uploadProfilePhoto);
router.delete('/photo', authenticateToken, deleteProfilePhoto);
router.get('/photo/:userId', getProfilePhoto);

module.exports = router;
```

## Frontend Implementation

### 1. Storage Functions

The `frontend/assets/js/storage.js` file provides frontend storage functions:

```javascript
// Storage functions using Supabase
import { supabase } from './supabase.js';

// Upload profile photo
async function uploadProfilePhoto(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    throw new Error(`Failed to upload profile photo: ${error.message}`);
  }
}

// Delete profile photo
async function deleteProfilePhoto(userId, fileName) {
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/${fileName}`]);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to delete profile photo: ${error.message}`);
  }
}

// Get public URL for a file
function getPublicUrl(bucketName, fileName) {
  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    throw new Error(`Failed to get public URL: ${error.message}`);
  }
}

export {
  uploadProfilePhoto,
  deleteProfilePhoto,
  getPublicUrl
};
```

### 2. Profile Photo Component

Create a reusable profile photo component:

```javascript
// frontend/assets/js/components/profile-photo.js
import { uploadProfilePhoto, deleteProfilePhoto } from '../storage.js';
import { supabase } from '../supabase.js';

class ProfilePhotoComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.userId = null;
    this.currentPhotoUrl = null;
    this.init();
  }
  
  init() {
    if (!this.container) return;
    
    this.render();
    this.bindEvents();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="profile-photo-container">
        <div class="photo-preview">
          <img id="profilePhoto" src="${this.currentPhotoUrl || '/assets/images/default-avatar.png'}" alt="Profile Photo">
        </div>
        <div class="photo-controls">
          <input type="file" id="photoUpload" accept="image/*" style="display: none;">
          <button id="uploadBtn" class="btn btn-primary">Upload Photo</button>
          ${this.currentPhotoUrl ? '<button id="deleteBtn" class="btn btn-danger">Delete Photo</button>' : ''}
        </div>
        <div id="photoMessage" class="photo-message"></div>
      </div>
    `;
  }
  
  bindEvents() {
    const uploadBtn = this.container.querySelector('#uploadBtn');
    const deleteBtn = this.container.querySelector('#deleteBtn');
    const photoUpload = this.container.querySelector('#photoUpload');
    
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        photoUpload.click();
      });
    }
    
    if (photoUpload) {
      photoUpload.addEventListener('change', (e) => {
        this.handlePhotoUpload(e.target.files[0]);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.handlePhotoDelete();
      });
    }
  }
  
  async handlePhotoUpload(file) {
    if (!file) return;
    
    const messageEl = this.container.querySelector('#photoMessage');
    messageEl.textContent = 'Uploading...';
    messageEl.className = 'photo-message uploading';
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload photo
      const photoUrl = await uploadProfilePhoto(user.id, file);
      
      // Update UI
      this.currentPhotoUrl = photoUrl;
      this.updatePhotoDisplay();
      
      messageEl.textContent = 'Photo uploaded successfully!';
      messageEl.className = 'photo-message success';
      
      // Clear message after delay
      setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'photo-message';
      }, 3000);
    } catch (error) {
      messageEl.textContent = `Upload failed: ${error.message}`;
      messageEl.className = 'photo-message error';
    }
  }
  
  async handlePhotoDelete() {
    if (!confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }
    
    const messageEl = this.container.querySelector('#photoMessage');
    messageEl.textContent = 'Deleting...';
    messageEl.className = 'photo-message uploading';
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Delete photo
      await deleteProfilePhoto(user.id, 'profile.jpg'); // or appropriate extension
      
      // Update UI
      this.currentPhotoUrl = null;
      this.updatePhotoDisplay();
      
      messageEl.textContent = 'Photo deleted successfully!';
      messageEl.className = 'photo-message success';
      
      // Clear message after delay
      setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'photo-message';
      }, 3000);
    } catch (error) {
      messageEl.textContent = `Delete failed: ${error.message}`;
      messageEl.className = 'photo-message error';
    }
  }
  
  updatePhotoDisplay() {
    const photoImg = this.container.querySelector('#profilePhoto');
    if (photoImg) {
      photoImg.src = this.currentPhotoUrl || '/assets/images/default-avatar.png';
    }
    
    // Re-render controls to show/hide delete button
    this.render();
    this.bindEvents();
  }
  
  setUserId(userId) {
    this.userId = userId;
  }
  
  setPhotoUrl(photoUrl) {
    this.currentPhotoUrl = photoUrl;
    this.updatePhotoDisplay();
  }
}

export default ProfilePhotoComponent;
```

### 3. Profile Page Integration

Integrate profile photo functionality into the profile page:

```javascript
// frontend/pages/profile.js
import ProfilePhotoComponent from '../assets/js/components/profile-photo.js';
import { supabase } from '../assets/js/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize profile photo component
  const profilePhotoComponent = new ProfilePhotoComponent('profilePhotoContainer');
  
  // Load current user data
  await loadUserProfile(profilePhotoComponent);
});

async function loadUserProfile(component) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Set user ID
      component.setUserId(user.id);
      
      // Get user profile data
      const { data: profile, error } = await supabase
        .from('users')
        .select('photo_url')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.photo_url) {
        // Set current photo URL
        component.setPhotoUrl(profile.photo_url);
      }
    }
  } catch (error) {
    console.error('Failed to load user profile:', error);
  }
}
```

## Firebase to Supabase Storage Mapping

### 1. File Upload (Firebase → Supabase)

**Firebase Storage:**
```javascript
// Upload file to Firebase Storage
const storageRef = firebase.storage().ref(`avatars/${userId}/profile.jpg`);
const uploadTask = storageRef.put(file);

uploadTask.then(async (snapshot) => {
  const downloadURL = await snapshot.ref.getDownloadURL();
  // Update user profile with downloadURL
});
```

**Supabase Storage:**
```javascript
// Upload file to Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/profile.jpg`, file, {
    cacheControl: '3600',
    upsert: true
  });

if (!error) {
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/profile.jpg`);
  
  // Update user profile with publicUrl
}
```

### 2. File Download (Firebase → Supabase)

**Firebase Storage:**
```javascript
// Get download URL from Firebase Storage
const storageRef = firebase.storage().ref(`avatars/${userId}/profile.jpg`);
const downloadURL = await storageRef.getDownloadURL();
```

**Supabase Storage:**
```javascript
// Get public URL from Supabase Storage
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/profile.jpg`);

const publicUrl = data.publicUrl;
```

### 3. File Deletion (Firebase → Supabase)

**Firebase Storage:**
```javascript
// Delete file from Firebase Storage
const storageRef = firebase.storage().ref(`avatars/${userId}/profile.jpg`);
await storageRef.delete();
```

**Supabase Storage:**
```javascript
// Delete file from Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/profile.jpg`]);
```

## Bucket Configuration

### 1. Storage Buckets

Create storage buckets for different types of files:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create game-assets bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('game-assets', 'game-assets', true);

-- Create private-documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('private-documents', 'private-documents', false);
```

### 2. RLS Policies

Set up Row Level Security policies for storage:

```sql
-- Users can upload their own avatar
CREATE POLICY "Users can upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can read avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');
```

## Performance Optimization

### 1. Image Optimization

Use Supabase's image transformation features:

```javascript
// Get optimized image URL
function getOptimizedImageUrl(bucketName, fileName, options = {}) {
  const { width, height, resize, quality } = options;
  
  let url = `${supabase.storageUrl}/object/public/${bucketName}/${fileName}`;
  
  const params = new URLSearchParams();
  if (width) params.append('width', width);
  if (height) params.append('height', height);
  if (resize) params.append('resize', resize);
  if (quality) params.append('quality', quality);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
}

// Usage
const thumbnailUrl = getOptimizedImageUrl('avatars', 'user123/profile.jpg', {
  width: 200,
  height: 200,
  resize: 'cover',
  quality: 80
});
```

### 2. Caching Strategy

Implement client-side caching:

```javascript
// Cache profile photos
const photoCache = new Map();

async function getCachedProfilePhoto(userId) {
  // Check cache first
  if (photoCache.has(userId)) {
    const cached = photoCache.get(userId);
    // Check if cache is still valid (5 minutes)
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.url;
    }
  }
  
  // Fetch fresh URL
  const { data: profile } = await supabase
    .from('users')
    .select('photo_url')
    .eq('id', userId)
    .single();
  
  if (profile && profile.photo_url) {
    // Cache the result
    photoCache.set(userId, {
      url: profile.photo_url,
      timestamp: Date.now()
    });
    
    return profile.photo_url;
  }
  
  return null;
}
```

### 3. Lazy Loading

Implement lazy loading for profile photos:

```javascript
// Lazy load profile photos
function lazyLoadProfilePhotos() {
  const photoElements = document.querySelectorAll('[data-lazy-photo]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const userId = img.dataset.lazyPhoto;
        
        // Load photo
        loadProfilePhoto(userId, img);
        
        // Stop observing this element
        observer.unobserve(img);
      }
    });
  });
  
  photoElements.forEach(el => observer.observe(el));
}

async function loadProfilePhoto(userId, imgElement) {
  try {
    const photoUrl = await getCachedProfilePhoto(userId);
    if (photoUrl) {
      imgElement.src = photoUrl;
    } else {
      imgElement.src = '/assets/images/default-avatar.png';
    }
  } catch (error) {
    console.error('Failed to load profile photo:', error);
    imgElement.src = '/assets/images/default-avatar.png';
  }
}
```

## Error Handling

### 1. Common Storage Errors

```javascript
// Handle storage errors
function handleStorageError(error) {
  console.error('Storage error:', error);
  
  // Handle specific error types
  if (error.message.includes('Bucket not found')) {
    return 'Storage bucket not configured properly';
  }
  
  if (error.message.includes('Access denied')) {
    return 'You do not have permission to perform this action';
  }
  
  if (error.message.includes('Quota exceeded')) {
    return 'Storage quota exceeded';
  }
  
  return 'An error occurred while processing your request';
}
```

### 2. File Validation

```javascript
// Validate uploaded files
function validateFile(file) {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and GIF files are allowed');
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }
  
  // Check dimensions for images (optional)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > 2000 || img.height > 2000) {
        reject(new Error('Image dimensions must be less than 2000x2000 pixels'));
      } else {
        resolve(true);
      }
    };
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = URL.createObjectURL(file);
  });
}
```

## Testing

### 1. Unit Tests

```javascript
// Test file upload
test('should upload profile photo successfully', async () => {
  const userId = 'test123';
  const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
  
  const photoUrl = await uploadProfilePhoto(userId, file);
  
  expect(photoUrl).toContain('avatars');
  expect(photoUrl).toContain(userId);
});

// Test file deletion
test('should delete profile photo successfully', async () => {
  const userId = 'test123';
  
  const result = await deleteProfilePhoto(userId, 'profile.jpg');
  
  expect(result).toBeDefined();
});

// Test URL generation
test('should generate public URL correctly', () => {
  const url = getPublicUrl('avatars', 'test123/profile.jpg');
  
  expect(url).toContain('storage');
  expect(url).toContain('avatars');
  expect(url).toContain('test123/profile.jpg');
});
```

### 2. Integration Tests

```javascript
// Test complete profile photo flow
test('should handle complete profile photo flow', async () => {
  const userId = 'integration-test-user';
  const file = new File(['test-image-data'], 'profile.jpg', { type: 'image/jpeg' });
  
  // 1. Upload photo
  const uploadUrl = await uploadProfilePhoto(userId, file);
  expect(uploadUrl).toBeTruthy();
  
  // 2. Get photo URL
  const { data: profile } = await supabase
    .from('users')
    .select('photo_url')
    .eq('id', userId)
    .single();
  
  expect(profile.photo_url).toBe(uploadUrl);
  
  // 3. Delete photo
  await deleteProfilePhoto(userId, 'profile.jpg');
  
  // 4. Verify deletion
  const { data: updatedProfile } = await supabase
    .from('users')
    .select('photo_url')
    .eq('id', userId)
    .single();
  
  expect(updatedProfile.photo_url).toBeFalsy();
});
```

## Migration Strategy

### 1. Data Migration

Migrate existing Firebase Storage files to Supabase:

```javascript
// Migration script for existing files
async function migrateProfilePhotos() {
  try {
    // Get all users with profile photos
    const { data: users, error } = await supabase
      .from('users')
      .select('id, photo_url')
      .not('photo_url', 'is', null);
    
    if (error) throw error;
    
    // Process each user
    for (const user of users) {
      // Skip if already migrated (check if URL is from Supabase)
      if (user.photo_url.includes('supabase')) {
        continue;
      }
      
      // Download from Firebase (you'll need Firebase SDK for this)
      // const firebasePhoto = await downloadFromFirebase(user.photo_url);
      
      // Upload to Supabase
      // const fileName = `${user.id}/profile.jpg`;
      // await uploadFile('avatars', fileName, firebasePhoto, 'image/jpeg');
      
      // Get new URL
      // const newUrl = getFileUrl('avatars', fileName);
      
      // Update user record
      // await supabase
      //   .from('users')
      //   .update({ photo_url: newUrl })
      //   .eq('id', user.id);
    }
    
    console.log('Profile photo migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

### 2. Gradual Migration

1. Set up Supabase Storage alongside Firebase Storage
2. Redirect new uploads to Supabase
3. Migrate existing files in batches
4. Update URLs in database
5. Remove Firebase Storage dependencies

## Best Practices

1. **Use appropriate bucket permissions** - Public for avatars, private for sensitive documents
2. **Implement file validation** - Check type, size, and dimensions
3. **Use caching** - Cache URLs to reduce database queries
4. **Implement lazy loading** - Load images only when visible
5. **Optimize images** - Use Supabase's transformation features
6. **Handle errors gracefully** - Provide user-friendly error messages
7. **Monitor storage usage** - Track quotas and costs
8. **Use consistent naming** - Standardize file paths and names
9. **Implement cleanup** - Remove unused files periodically
10. **Secure private files** - Use signed URLs for sensitive content

## Support

For issues with Supabase Storage implementation:
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)