import express from 'express';
import { 
  getAllClients, 
  deleteClient, 
  updateClient, 
  getAllClientPosts, 
  updateClientPostByAdmin, 
  deleteClientPostByAdmin, 
  getTotalPosts 
} from '../addminController/adminCltController.js'; // Adjust import path

import { authMiddleware } from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import upload from '../middleware/uploadClientDocuments.js'; // Corrected import path for the upload middleware

const adminRouter = express.Router();

// Route for admin to get all clients
adminRouter.get('/all-clients', authMiddleware, adminMiddleware, getAllClients);

// Route to delete a client
adminRouter.delete('/delete-client/:accountId', authMiddleware, adminMiddleware, deleteClient);

// Routes for handling posts
adminRouter.get('/posts', authMiddleware, adminMiddleware, getAllClientPosts);
adminRouter.put('/posts/:id', authMiddleware, adminMiddleware, updateClientPostByAdmin);
adminRouter.delete('/posts/:id', authMiddleware, adminMiddleware, deleteClientPostByAdmin);

// Get total posts
adminRouter.get('/total-posts', authMiddleware, adminMiddleware, getTotalPosts);
adminRouter.get('/diaplay-posts', getTotalPosts);

// Route to update client details (including citizenship image)
adminRouter.put(
  '/update-client/:accountId',
  authMiddleware,               // Authorization middleware
  adminMiddleware,               // Admin check middleware
  upload.fields([                // Upload middleware for citizenship image
    { name: 'citizenshipImage', maxCount: 1 } 
  ]), 
  updateClient                   // Controller function for updating client details
);


export default adminRouter;
