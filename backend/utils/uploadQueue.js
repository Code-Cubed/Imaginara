const Bull = require('bull');
const fs = require('fs-extra');
const path = require('path');
const { uploadToCloudinary } = require('../middlewares/upload');
const Artwork = require('../models/Artwork');

// ─── Bull Queue (requires Redis running on default port 6379) ───────────────
const uploadQueue = new Bull('cloudinary-upload', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    attempts: 5,                  // retry up to 5 times
    backoff: {
      type: 'exponential',
      delay: 10000,               // start with 10s, doubles each retry
    },
    removeOnComplete: true,       // clean up finished jobs
    removeOnFail: false,          // keep failed jobs for inspection
  },
});

// ─── Local fallback folder ───────────────────────────────────────────────────
const FALLBACK_DIR = path.join(__dirname, '../temp_uploads');
fs.ensureDirSync(FALLBACK_DIR); // create folder if it doesn't exist

// ─── Save file locally when Cloudinary is down ──────────────────────────────
const saveLocally = async (buffer, filename) => {
  const filePath = path.join(FALLBACK_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

// ─── Add a retry job to the queue ───────────────────────────────────────────
const queueRetryUpload = async ({ filePath, folder, mediaType, artworkId }) => {
  const job = await uploadQueue.add({ filePath, folder, mediaType, artworkId });
  console.log(`📦 Queued retry upload job ${job.id} for artwork ${artworkId}`);
  return job;
};

// ─── Worker: process queued jobs ────────────────────────────────────────────
uploadQueue.process(async (job) => {
  const { filePath, folder, mediaType, artworkId } = job.data;

  console.log(`🔄 Retrying Cloudinary upload for artwork ${artworkId} (attempt ${job.attemptsMade + 1})`);

  // Read the locally saved file back into a buffer
  const buffer = await fs.readFile(filePath);

  // Try uploading to Cloudinary
  const uploaded = await uploadToCloudinary(buffer, folder, mediaType);

  // Update the artwork in MongoDB with the real Cloudinary URL
  await Artwork.findByIdAndUpdate(artworkId, {
    mediaUrl: uploaded.secure_url,
    thumbnailUrl: uploaded.eager?.[0]?.secure_url || uploaded.secure_url,
    isPending: false,
  });

  // Delete the local temp file after successful upload
  await fs.remove(filePath);

  console.log(`✅ Retry upload successful for artwork ${artworkId}`);
  return { success: true, artworkId, url: uploaded.secure_url };
});

// ─── Queue event listeners ───────────────────────────────────────────────────
uploadQueue.on('failed', (job, err) => {
  console.error(`❌ Upload job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

uploadQueue.on('completed', (job, result) => {
  console.log(`✅ Upload job ${job.id} completed for artwork ${result.artworkId}`);
});

module.exports = { saveLocally, queueRetryUpload, FALLBACK_DIR };
