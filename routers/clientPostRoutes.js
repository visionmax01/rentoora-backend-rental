// routes/clientPostRoutes.js
import express from 'express';
import {
  createClientPost,
  getClientPosts,
  deleteClientPost,
  updateClientPost
} from '../controllers/clientPostController.js';
import authenticate from '../middleware/authenticate.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Route to create a post (client must be authenticated)
router.post(
  '/post',
  authenticate,
  upload.array('images', 3),
  createClientPost
);

// Route to get posts created by the logged-in user
router.get('/post', authenticate, getClientPosts);

// Route to delete a post
router.delete('/posts/:id', authenticate, deleteClientPost);
router.put('/posts/:id', authenticate, updateClientPost);

export default router;
