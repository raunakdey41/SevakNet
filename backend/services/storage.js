'use strict';

/**
 * services/storage.js
 * Cloudinary-powered photo storage for SevakNet completion evidence.
 *
 * Free tier: 25 GB storage / 25 GB bandwidth / month — no credit card needed.
 *
 * Set in .env:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 *
 * Get free credentials at: https://cloudinary.com/users/register_free
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a completion photo buffer to Cloudinary.
 * @param {string} assignmentId
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<string>} secure public URL
 */
async function uploadCompletionPhoto(assignmentId, buffer, mimetype = 'image/jpeg') {
  // Dev-mode: if Cloudinary not configured, return a placeholder
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    console.log(`[Storage — dev mode] Photo upload simulated for assignment ${assignmentId}`);
    return `https://placehold.co/800x600/1c2230/00D2B4?text=Evidence+Photo+(dev+mode)`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        'sevaknet/completions',
        public_id:     `${assignmentId}_${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 1200, quality: 'auto:good', fetch_format: 'auto' }],
        tags:          ['sevaknet', 'completion-evidence'],
      },
      (error, result) => {
        if (error) return reject(new Error(error.message));
        console.log(`[Storage] Photo uploaded: ${result.secure_url}`);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

module.exports = { uploadCompletionPhoto };
