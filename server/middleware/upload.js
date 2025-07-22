// server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration for courses
const courseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(__dirname, '../../uploads/courses');
    } else if (file.fieldname.startsWith('module_file_')) {
      uploadPath = path.join(__dirname, '../../uploads/modules');
    } else {
      uploadPath = path.join(__dirname, '../../uploads/temp');
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    if (file.fieldname === 'thumbnail') {
      cb(null, `course-thumbnail-${uniqueSuffix}${ext}`);
    } else if (file.fieldname.startsWith('module_file_')) {
      const moduleIndex = file.fieldname.split('_')[2];
      cb(null, `module-${moduleIndex}-${uniqueSuffix}${ext}`);
    } else {
      cb(null, `file-${uniqueSuffix}${ext}`);
    }
  }
});

// File filter
const courseFileFilter = (req, file, cb) => {
  if (file.fieldname === 'thumbnail') {
    // For thumbnails, accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Thumbnail must be an image file'), false);
    }
  } else if (file.fieldname.startsWith('module_file_')) {
    // For module files, accept PDF only
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Module files must be PDF format'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Simple upload configuration that handles dynamic fields
const uploadCourse = (req, res, next) => {
  // Create multer instance
  const upload = multer({
    storage: courseStorage,
    fileFilter: courseFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 20 // Maximum 20 files
    }
  });

  // Parse modules to determine expected file fields
  let moduleCount = 0;
  
  if (req.body.modules) {
    try {
      const modules = JSON.parse(req.body.modules);
      moduleCount = modules.length;
    } catch (error) {
      // If parsing fails, continue with default
      moduleCount = 0;
    }
  }

  // Create fields array for multer
  const fields = [
    { name: 'thumbnail', maxCount: 1 }
  ];

  // Add module file fields dynamically
  for (let i = 0; i < Math.max(moduleCount, 10); i++) { // Max 10 modules for safety
    fields.push({ name: `module_file_${i}`, maxCount: 1 });
  }

  // Use multer with dynamic fields
  const uploadFields = upload.fields(fields);
  
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
        error: err.code || 'UPLOAD_ERROR'
      });
    }
    next();
  });
};

module.exports = {
  uploadCourse
};