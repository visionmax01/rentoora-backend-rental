import User from '../models/clientadModel.js'; // Adjust the import based on your project structure
import ClientPost from '../models/clientPost.js'
import RentalPost from '../models/rentalPostModel.js';
import fs from 'fs';
import path from 'path';
// Controller to get all clients (users with role 0)
export const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 0 }).select(
      'name email phoneNo dateOfBirth address accountId profilePhotoPath citizenshipImagePath role'
    );
    
    if (!clients || clients.length === 0) {
      return res.status(404).json({ message: 'No clients found' });
    }

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients' });
  }
};



// Controller to delete a client
export const deleteClient = async (req, res) => {
  try {
    const { accountId } = req.params;

    const client = await User.findOneAndDelete({ accountId });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error: error.message });
  }
};





// Controller function for updating client details
export const updateClient = async (req, res) => {
  const { clientId } = req.params;
  const { dateOfBirth, name, email, phoneNo, address } = req.body;
  const citizenshipImage = req.files?.citizenshipImage?.[0]?.path; // Path to uploaded citizenship image

  try {
    // Find the client by ID and update the relevant fields
    const updatedClient = await User.findByIdAndUpdate(
      clientId,
      {
        dateOfBirth,
        name,
        email,
        phoneNo,
        address,
        ...(citizenshipImage && { citizenshipImage }), // Update citizenshipImage if it was uploaded
      },
      { new: true } // Return the updated document
    );

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({ message: "Client updated successfully", updatedClient });
  } catch (error) {
    console.error("Error updating client details:", error); // Log the error for debugging
    res.status(500).json({ message: "Error updating client details", error: error.message });
  }
};










// Get all posts with associated client information


// Get all client posts (Admin only)


// Controller to get all client posts

export const getAllClientPosts = async (req, res) => {
  try {
    // Fetch all client posts and populate the clientId with user details
    const posts = await RentalPost.find()
      .populate({
        path: 'clientId', // This should match the field name in ClientPost schema
        select: 'name accountId', // Specify which fields to return from User
      })
      .select('postType price description images createdAt clientId') 
      .exec();

    res.status(200).json(posts); 
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};





  




// Update a client post (Admin only)
export const updateClientPostByAdmin = async (req, res) => {
  try {
    const { type, description, price } = req.body;
    const postId = req.params.id;

    // Find the post
    const post = await RentalPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Update fields if they are present
    post.postType = type || post.postType;
    post.description = description || post.description;
    post.price = price || post.price;

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

    res.status(200).json({ message: 'Post updated successfully by admin', post });
  } catch (error) {
    console.error('Error updating post by admin:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a client post (Admin only)
export const deleteClientPostByAdmin = async (req, res) => {
  try {
    const postId = req.params.id;

    // Find the post
    const post = await RentalPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete associated images
    post.images.forEach((imagePath) => {
      const fullPath = path.resolve(imagePath);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Error deleting image: ${fullPath}`, err);
        } else {
          console.log(`Successfully deleted: ${fullPath}`);
        }
      });
    });

    // Delete the post
    await RentalPost.deleteOne({ _id: postId });

    res.status(200).json({ message: 'Post and associated images deleted successfully by admin' });
  } catch (error) {
    console.error('Error deleting post by admin:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};






// Function to get total number of posts
export const getTotalPosts = async (req, res) => {
  try {
    const totalPosts = await RentalPost.countDocuments({});
    res.status(200).json({ count: totalPosts });
  } catch (error) {
    console.error('Error fetching total posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
