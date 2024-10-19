import User from '../models/clientadModel.js'; // Adjust the import based on your project structure
import RentalPost from '../models/rentalPostModel.js';
import fs from 'fs';
import path, {dirname} from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import cloudinary from 'cloudinary'; // Make sure to import cloudinary


// Controller to get all clients (users with role 0)
export const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 0 }).select(
      'name email phoneNo dateOfBirth province district municipality accountId profilePhotoPath citizenshipImagePath role'
    );
    
    if (!clients || clients.length === 0) {
      return res.status(404).json({ message: 'No clients found' });
    }

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients' });
  }
};





// Delete a client and associated images
export const deleteClient = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Find the client by accountId
    const client = await User.findOneAndDelete({ accountId });

    if (!client) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated images (profile photo and citizenship image)
    const imagesToDelete = [client.profilePhotoPath, client.citizenshipImagePath];

    imagesToDelete.forEach((imagePath) => {
      if (imagePath) {
        const fullPath = path.resolve(imagePath);
        console.log(`Attempting to delete: ${fullPath}`);

        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting image: ${fullPath}`, err);
          } else {
            console.log(`Successfully deleted: ${fullPath}`);
          }
        });
      }
    });

    return res.status(200).json({ message: 'Client and associated images deleted successfully' });
  } catch (error) {
    console.error('Error in deleteClient:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};








// Controller function for updating client details




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const updateClient = async (req, res) => {
  const { accountId } = req.params;
  const { dateOfBirth, name, email, phoneNo, province, district, municipality } = req.body;

  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Verify and decode the token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; // Adjust according to how your token is structured

    // Find the existing client to get the current citizenship image
    const existingClient = await User.findOne({ accountId });
    
    // If client does not exist, return an error
    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get the citizenship image path if a new file was uploaded
    const newCitizenshipImage = req.files?.citizenshipImage?.[0]?.filename; // Use the filename stored by multer
    const citizenshipImagePath = newCitizenshipImage 
      ? path.join('public/ClientDocuments', newCitizenshipImage) 
      : existingClient.citizenshipImagePath; // Use new image or retain existing

    // If a new image was uploaded, delete the old image
    if (newCitizenshipImage) {
      const oldImagePath = path.join(__dirname, existingClient.citizenshipImagePath); // Correct path here
      console.log("Attempting to delete file at:", oldImagePath); // Log the file path

      if (fs.existsSync(oldImagePath)) {
        console.log("Deleting old citizenship image:", oldImagePath);
        fs.unlinkSync(oldImagePath); // Synchronously delete the old image
      } else {
        console.log("File not found, skipping deletion:", oldImagePath);
      }
    }

    // Update client details
    existingClient.dateOfBirth = dateOfBirth;
    existingClient.name = name;
    existingClient.email = email;
    existingClient.phoneNo = phoneNo;
    existingClient.province = province;
    existingClient.district = district;
    existingClient.municipality = municipality;
    existingClient.citizenshipImagePath = citizenshipImagePath; // Update the citizenshipImagePath

    await existingClient.save(); // Save the updated client

    res.status(200).json({ message: "Client updated successfully", updatedClient: existingClient });
  } catch (error) {
    console.error("Error updating client details:", error);
    res.status(500).json({ message: "Error updating client details", error: error.message });
  }
};






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

    // Delete associated images from Cloudinary
    await Promise.all(post.images.map(async (image) => {
      const publicId = image.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, ""); // Extract public ID correctly
      console.log(`Attempting to delete image with public ID: ${publicId}`);
      try {
        await cloudinary.v2.uploader.destroy(publicId); // Delete image from Cloudinary
        console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
      } catch (err) {
        console.error(`Error deleting image from Cloudinary: ${publicId}`, err);
      }
    }));

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
