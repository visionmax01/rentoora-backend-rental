import express from 'express';
import { getClientCount } from '../controllers/countingController.js';
import auth, { requireAdmin } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getRecentUsers, sendFeedbackEmails } from '../controllers/sendFeadbackMail.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const adminclientrouter = express.Router();

adminclientrouter.get('/clients',auth,authMiddleware,requireAdmin, getClientCount);
adminclientrouter.get('/recent-users', authMiddleware, adminMiddleware, getRecentUsers);
adminclientrouter.post('/send-feedback-emails', authMiddleware, adminMiddleware, sendFeedbackEmails);


export default  adminclientrouter;