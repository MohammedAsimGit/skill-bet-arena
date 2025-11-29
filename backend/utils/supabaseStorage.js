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