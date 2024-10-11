import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/clientadModel.js';
import path from 'path';
import fs from 'fs';


const generateAccountId = (firstName) => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${firstName}${randomNum}`;
};

// created by Bhishan sah 
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNo, dateOfBirth, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const firstName = name.charAt(0).toUpperCase();
    const accountId = generateAccountId(firstName);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      accountId,
      role: role === 1 ? 1 : 0, // Ensure role is either 0 or 1 where 0 for client & 1 for admin
      phoneNo,
      dateOfBirth,
      address,
      profilePhotoPath: req.files['profilePhoto'] ? req.files['profilePhoto'][0].path : null,
      citizenshipImagePath: req.files['citizenshipImage'] ? req.files['citizenshipImage'][0].path : null
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', accountId });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the old password
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in the database
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};
//
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token with user email, id, and role
    const token = jwt.sign(
      { email: user.email, id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Decide redirect URL based on user role
    const redirectUrl = user.role === 1 ? '/admin-dashboard' : '/client-dashboard';

    // Send response with token and role-based redirect URL
    res.status(200).json({
      result: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      redirectUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};


export const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email role accountId profilePhotoPath citizenshipImagePath phoneNo dateOfBirth address');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      ...user._doc,
      profilePic: user.profilePhotoPath, 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out' });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { name, email, phoneNo, address } = req.body;
    const userId = req.userId;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      name,
      email,
      phoneNo,
      address
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User details updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user details', error: error.message });
  }
};




export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Extract token from headers
    const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Verify and decode the token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure JWT_SECRET is correctly set in your environment
    const userId = decoded.id; // Adjust according to how your token is structured

    const profilePicPath = path.join('public/ClientDocuments', req.file.filename);

    // Find the user and update their profile picture path
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Debugging: Log the old profile picture path
    console.log('Old profile picture path:', user.profilePhotoPath);

    if (user.profilePhotoPath) {
      const oldProfilePicPath = path.join('', user.profilePhotoPath);


      if (fs.existsSync(oldProfilePicPath)) {
        console.log('Deleting file:', oldProfilePicPath);
        fs.unlinkSync(oldProfilePicPath);
      } else {
        console.log('File does not exist, skipping deletion:', oldProfilePicPath);
      }
    }

    // Update the user's profile picture path
    user.profilePhotoPath = profilePicPath;
    await user.save();

    res.status(200).json({ message: 'Profile picture updated successfully.' });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
