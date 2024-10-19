// controllers/clientPostController.js
import RentalPost from '../models/rentalPostModel.js';
import fs from 'fs';
import path from 'path';


export const createClientPost = async (req, res) => {
  try {
    const { type, description, price, province, district, municipality, landmark } = req.body;
    const userId = req.userId;

    // Validate input fields
    if (!type || !description || !price || !province || !district || !municipality || isNaN(price)) {
      return res.status(400).json({ message: 'Please fill out all fields correctly.' });
    }

    // Extract Cloudinary URLs
    const images = req.files.map(file => file.path);

    const newPost = new RentalPost({
      clientId: userId,
      postType: type,
      description,
      price,
      address: {
        province,
        district,
        municipality,
        landmark,
      },
      images, // Use Cloudinary URLs
      status: 'not booked',
    });

    await newPost.save();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





// Update a post
export const updateClientPost = async (req, res) => {
  try {
    const { type, description, price, landmark } = req.body;  // Extract landmark
    const userId = req.userId;
    const postId = req.params.id;

    // Find the post
    const post = await RentalPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.clientId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Update fields if they are present
    post.postType = type || post.postType;
    post.description = description || post.description;
    post.price = price || post.price;
    post.address.landmark = landmark || post.address.landmark;  // Update landmark

    // If new images are uploaded, replace the old images
    if (req.files && req.files.length > 0) {
      // Delete old images from server
      post.images.forEach((imagePath) => {
        const fullPath = path.resolve(imagePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting image: ${fullPath}`, err);
          }
        });
      });

      // Add new images
      post.images = req.files.map((file) =>
        path.join('public/RoomFolder', file.filename)
      );
    }

    // Save the updated post
    await post.save();

    res.status(200).json({ message: 'Post updated successfully', post });
  } catch (error) {
    console.error('Error updating post:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getClientPosts = async (req, res) => {
    try {
      const userId = req.userId; // Check if this is set correctly
      const posts = await RentalPost.find({ clientId: userId });
      res.status(200).json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

// Delete a post
export const deleteClientPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    // Find the post
    const post = await RentalPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.clientId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    post.images.forEach((imagePath) => {
      const fullPath = path.resolve(imagePath);
      console.log(`Attempting to delete: ${fullPath}`);

      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Error deleting image: ${fullPath}`, err);
        } else {
          console.log(`Successfully deleted: ${fullPath}`);
        }
      });
    });

    // Use deleteOne() or findByIdAndDelete()
    await RentalPost.deleteOne({ _id: postId });

    return res.status(200).json({ message: 'Post and associated images deleted successfully' });
  } catch (error) {
    console.error('Error in deleteClientPost:', error); // Log the error to identify the issue
    return res.status(500).json({ message: 'Internal server error' });
  }
};
