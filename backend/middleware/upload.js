const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'foodiez',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  },
});

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload single image
exports.uploadSingle = (fieldName) => upload.single(fieldName);

// Upload multiple images
exports.uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Upload mixed fields
exports.uploadFields = (fields) => upload.fields(fields);

// Delete image from Cloudinary
exports.deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
exports.getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

module.exports = { cloudinary };