import express from 'express';
import { getClientCount } from '../controllers/countingController.js';
import auth, { requireAdmin } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const adminclientrouter = express.Router();

adminclientrouter.get('/clients',auth,authMiddleware,requireAdmin, getClientCount);


export default  adminclientrouter;