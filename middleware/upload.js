import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const __dirname = path.resolve();
const uploadDir = path.join(__dirname, 'public');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/RoomFolder'); // Directory where images will be saved
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
    ); // Unique filename
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png allowed)'));
  }
};

// Limit file size to 200 KB (200 * 1024 bytes)
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 }, // 200 KB limit per file
  fileFilter,
});

export default upload;
