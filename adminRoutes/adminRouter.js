import express from 'express';
import { getAllClients, deleteClient, updateClient, getAllClientPosts,updateClientPostByAdmin,deleteClientPostByAdmin,getTotalPosts } from '../addminController/adminCltController.js'; // Adjust import path
import {authMiddleware} from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import upload from '../middleware/upload.js';

const adminRouter = express.Router();

// Route for admin to get all clients
adminRouter.get('/all-clients', authMiddleware, adminMiddleware, getAllClients);
adminRouter.delete('/delete-client/:accountId', adminMiddleware, deleteClient);
adminRouter.get('/posts', adminMiddleware, getAllClientPosts);
adminRouter.put('/posts/:id', adminMiddleware, updateClientPostByAdmin);
adminRouter.delete('/posts/:id', adminMiddleware, deleteClientPostByAdmin);
adminRouter.get('/total-posts',adminMiddleware, getTotalPosts);
// adminRouter.put("/update-client/:accountId", authMiddleware,adminMiddleware, upload.single("profilePhoto"), updateClient);

adminRouter.put(
    '/update-client/:accountId', 
    upload.fields([{ name: 'citizenshipImage', maxCount: 1 }]), // Upload citizenship image
    authMiddleware,
    adminMiddleware,
    updateClient
  );
  

export default adminRouter;
