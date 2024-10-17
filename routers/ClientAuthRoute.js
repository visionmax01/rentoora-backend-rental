import express from 'express';
import { register, login, getUserData, logout, updateUserDetails, updateProfilePic,changePassword } from '../controllers/authController.js';
import { sendOTP, verifyOTP, resetPassword } from '../controllers/resetPassword.js';
import upload from '../middleware/uploadClientDocuments.js';
import auth, { requireAdmin } from '../middleware/auth.js';
import  authenticateToken  from '../middleware/authenticateToken.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const Clientrouter = express.Router();

Clientrouter.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'citizenshipImage', maxCount: 1 }
]), register);

Clientrouter.post('/update-profile-pic', upload.single('profilePic'), updateProfilePic);
Clientrouter.post('/login', login);
Clientrouter.post('/change-password', authenticateToken, changePassword);


Clientrouter.get('/profile', authenticateToken, getUserData, async (req, res) => {
  try {
    const user = await user.findById(req.user); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.set('Content-Type', 'image/'); 
    res.sendFile(path.join(__dirname, '../public/ClientDocuments', user.profilePhotoPath)); 
    res.sendFile(path.join(__dirname, '../public/ClientDocuments', user.citizenshipImagePath)); 
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile photo' });
  }
});

Clientrouter.put('/update-user-details', authenticateToken, updateUserDetails);

Clientrouter.get('/admin-dashboard', auth, requireAdmin, (req, res) => {
 //code here
});

Clientrouter.get('/user-data',authenticateToken getUserData);
Clientrouter.post('/logout', authenticateToken, logout);

Clientrouter.post('/send-otp', sendOTP);
Clientrouter.post('/verify-otp', verifyOTP);
Clientrouter.post('/reset-password', resetPassword);

export default Clientrouter;








