// routes/feedbackRoutes.js
import express from 'express';
import { createFeedback, getAllFeedbacks } from '../controllers/feedbackController.js';

const feadbackrouter = express.Router();

// POST: Create feedback
feadbackrouter.post('/sendFeadback', createFeedback);

// GET: Retrieve all feedback
feadbackrouter.get('/getfeadback', getAllFeedbacks);

export default  feadbackrouter;