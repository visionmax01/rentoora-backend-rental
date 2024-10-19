import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/clientadModel.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cloudinary from 'cloudinary';
dotenv.config();

// Function to generate a random password
const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

// Generate Account_ID
const generateAccountId = (firstName) => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${firstName}${randomNum}`;
};

// Nodemailer configuration for email sending
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Register to controll registration
export const register = async (req, res) => {
  try {
    const { name, email, role, phoneNo, dateOfBirth, province, district, municipality } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    const firstName = name.charAt(0).toUpperCase();
    const accountId = generateAccountId(firstName);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      accountId,
      role: role === 1 ? 1 : 0,
      phoneNo,
      dateOfBirth,
      province,
      district,
      municipality,
      profilePhotoPath: req.files['profilePhoto'] ? req.files['profilePhoto'][0].path : null,
      citizenshipImagePath: req.files['citizenshipImage'] ? req.files['citizenshipImage'][0].path : null,
    });

    await newUser.save();

    // Send welcome email with the generated password
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Welcome to Rentoora.com - Your Account Details',
      text: `Hello ${name},\n\nWelcome to Rentoora.com! Your account has been created successfully.\n\nYour Account ID: ${accountId}\nYour Password: ${randomPassword}\n\nPlease change your password after your first login.\n\nThank you for joining us!\n\nBest regards,\nThe Rentoora Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ message: 'User registered successfully, password sent to email', accountId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

//controller function for Change password 
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

//function to controller  Login  
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
      { expiresIn: '1h' } 
    );
    // Send the response
    res.status(200).json({
      result: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      redirectUrl: user.role === 1 ? '/admin-dashboard' : '/',
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};



// Get user data controller function
export const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name email role accountId profilePhotoPath citizenshipImagePath phoneNo dateOfBirth province district municipality');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      ...user._doc,
      profilePhotoPath: user.profilePhotoPath,
      citizenshipImagePath: user.citizenshipImagePath,
    });
  } catch (error) {
      console.error("Error fetching user data:", error);
  }
};

// Logout controller function
export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out' });
  }
};



// Update user details controller function
export const updateUserDetails = async (req, res) => {
  try {
    const { name, email, phoneNo, province, district, municipality } = req.body;
    const userId = req.userId;

    // Update user with the new details
    const updatedUser = await User.findByIdAndUpdate(userId, {
      name,
      email,
      phoneNo,
      province,
      district,
      municipality,
    }, { new: true }); // "new: true" returns the updated document

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return updated user details
    res.json({
      message: 'User details updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user details', error: error.message });
  }
};



// Update profile picture controller function



export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Verify and decode the token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete the old profile picture from Cloudinary if it exists
    if (user.profilePhotoPath) {
      const oldPublicId = user.profilePhotoPath.split('/').pop().split('.')[0]; // Get the public ID
      await cloudinary.v2.uploader.destroy(oldPublicId, { invalidate: true });
    }

    // Upload the new profile picture to Cloudinary
    const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'ClientDocuments/profilePhoto', 
    });
    user.profilePhotoPath = uploadResult.secure_url;
    await user.save();

    res.status(200).json({ message: 'Profile picture updated successfully.', profilePhotoPath: user.profilePhotoPath });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile picture.', error: error.message });
  }
};


// Update citizenship image controller function
export const updateCitizenshipImage = async (req, res) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; 

    const citizenshipImagePath = path.join('public/ClientDocuments', req.file.filename);

    // Find the user and update their citizenship image path
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.citizenshipImagePath) {
      const oldCitizenshipImagePath = path.join('', user.citizenshipImagePath);

      if (fs.existsSync(oldCitizenshipImagePath)) {
        console.log('Deleting file:', oldCitizenshipImagePath);
        fs.unlinkSync(oldCitizenshipImagePath);
      } else {
        console.log('File does not exist, skipping deletion:', oldCitizenshipImagePath);
      }
    }
    // Update the user's citizenship image path
    user.citizenshipImagePath = citizenshipImagePath;
    await user.save();

    res.status(200).json({ message: 'Citizenship image updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating citizenship image.', error: error.message });
  }
};
