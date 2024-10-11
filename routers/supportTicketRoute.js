import express from 'express';
import {
  createSupportTicket,
  updateSupportTicket,
  getClientTickets,
  deleteSupportTicket
} from '../controllers/supportTicketController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new support ticket
router.post('/create', authMiddleware, createSupportTicket);

// Get all support tickets for the logged-in user
router.get('/my-tickets', authMiddleware, getClientTickets);

// Update a support ticket
router.put('/update/:id', authMiddleware, updateSupportTicket);

// Delete a support ticket
router.delete('/delete/:id', authMiddleware, deleteSupportTicket);

export default router;
