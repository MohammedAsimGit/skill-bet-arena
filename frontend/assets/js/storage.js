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