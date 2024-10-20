import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/clientadModel.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


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
  const profilePhotoPath = req.files['profilePhoto'] ? req.files['profilePhoto'][0].path : null;
  const citizenshipImagePath = req.files['citizenshipImage'] ? req.files['citizenshipImage'][0].path : null;

  try {
    const { name, email, role, phoneNo, dateOfBirth, province, district, municipality } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists, delete the uploaded files from Cloudinary
      if (profilePhotoPath) {
        const publicId = profilePhotoPath.split('/').pop().split('.')[0]; // Extract public ID
        await cloudinary.v2.uploader.destroy(publicId);  // Delete profile photo from Cloudinary
      }
      if (citizenshipImagePath) {
        const publicId = citizenshipImagePath.split('/').pop().split('.')[0]; // Extract public ID
        await cloudinary.v2.uploader.destroy(publicId); // Delete citizenship image from Cloudinary
      }
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
      profilePhotoPath,
      citizenshipImagePath,
    });

    await newUser.save();

    // Send welcome email with the generated password
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Welcome to Rentoora.com - Your Account Details',
      html: `
       <div style="font-family: 'Arial', sans-serif;  padding: 20px;">
        <div style="max-width: 600px;  background-color: #fceded; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="padding: 20px; text-align: center; background-color: #4f46e5; color: #fafafa;">
            <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Welcome to Rentoora.com!</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #1f2937; margin-bottom: 16px;">
              Welcome to <strong>Rentoora.com</strong>! Your account has been created successfully.
            </p>
            <div style="padding: 16px; background-color: #f4daed; border-left: 4px solid #4f46e5; margin-bottom: 16px;">
              <p style="font-size: 14px; color: #4b5563;"><strong>Your Account ID:</strong> ${accountId}</p>
              <p style="font-size: 14px; color: #4b5563;"><strong>Your Password:</strong> ${randomPassword}</p>
            </div>
            <p style="font-size: 14px; color: #1f2937; margin-bottom: 16px;">
              Please change your password after your first login.
            </p>
            <p style="font-size: 14px; color: #1f2937;">
              Thank you for joining us!
            </p>
            <p style="font-size: 14px; color: #1f2937; margin-top: 16px;">
              Best regards,<br>
              <strong>The Rentoora Team</strong>
            </p>
          </div>
        </div>
      </div>
      `,
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
    
    // If an error occurs, delete the uploaded files from Cloudinary
    if (profilePhotoPath) {
      const publicId = profilePhotoPath.split('/').pop().split('.')[0]; // Extract public ID
      await cloudinary.v2.uploader.destroy(publicId);  // Delete profile photo from Cloudinary
    }
    if (citizenshipImagePath) {
      const publicId = citizenshipImagePath.split('/').pop().split('.')[0]; // Extract public ID
      await cloudinary.v2.uploader.destroy(publicId); // Delete citizenship image from Cloudinary
    }

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
      profilePic: user.profilePhotoPath,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
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





// Function to update profile photo
import cloudinary from 'cloudinary';


export const updateProfilePic = async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const token = req.headers.authorization?.split(' ')[1]; // Get Bearer token
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Verify the token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the user in the database
    const user = await User.findById(userId);
    console.log('User retrieved:', user); // Log the user object for debugging
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If the user already has a profile picture, delete the old one from Cloudinary
    if (user.profilePhotoPath) {
      const publicId = user.profilePhotoPath.split('ClientDocuments/profilePhoto/')[1].split('.')[0];
      console.log('Deleting old profile picture with public ID:', publicId);
      await cloudinary.v2.uploader.destroy(`ClientDocuments/profilePhoto/${publicId}`);
    }

    // Use the uploaded file information from the middleware
    user.profilePhotoPath = req.file.path; // The URL from the middleware
    await user.save(); // Save the user with the new profile photo path

    res.status(200).json({ message: 'Profile picture updated successfully.', profilePhotoPath: user.profilePhotoPath });
  } catch (error) {
    console.error('Error in updateProfilePic:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error updating profile picture.', error: error.message });
  }
};











