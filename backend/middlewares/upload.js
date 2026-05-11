const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

// Multer storage in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/mp3',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Upload to Cloudinary with proper resource type
const uploadToCloudinary = (buffer, folder = 'gallery', mediaType = 'image') => {
  return new Promise((resolve, reject) => {
    let uploadOptions = {
      folder: folder,
      resource_type: 'auto'
    };

    // Configure based on media type
    if (mediaType === 'video') {
      uploadOptions.resource_type = 'video';
      uploadOptions.eager = [
        { width: 300, height: 300, crop: 'pad', format: 'jpg' }
      ];
      uploadOptions.eager_async = true;
    } else if (mediaType === 'audio') {
      uploadOptions.resource_type = 'video'; // Cloudinary uses 'video' for audio
    } else if (mediaType === 'document') {
      uploadOptions.resource_type = 'raw'; // Use 'raw' for documents
    } else if (mediaType === 'image') {
      uploadOptions.resource_type = 'image';
      uploadOptions.eager = [
        { width: 400, height: 400, crop: 'fill', format: 'jpg' }
      ];
    }

    // Set a timeout so we don't hang forever if Cloudinary is unresponsive
    const uploadTimeout = setTimeout(() => {
      reject(new Error('CLOUDINARY_TIMEOUT: Upload timed out after 30 seconds'));
    }, 30000);

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        clearTimeout(uploadTimeout);
        if (error) {
          console.error('Cloudinary upload error:', error);
          // Tag the error so controllers can identify it
          error.isCloudinaryError = true;
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = { upload, uploadToCloudinary };