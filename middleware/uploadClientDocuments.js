// middleware/uploadClientDocuments.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/ClientDocuments');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    
    if (file.fieldname === 'profilePhoto') {
      cb(null, 'profilepic_' + uniqueSuffix + fileExtension);
    } else if (file.fieldname === 'citizenshipImage') {
      cb(null, 'citizenship_' + uniqueSuffix + fileExtension);
    } else {
      cb(null, file.fieldname + '_' + uniqueSuffix + fileExtension);
    }
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const uploadClientDoc = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit
  }
});

export default uploadClientDoc;
