import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/clientadModel.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
dotenv.config();

// ... (other functions and configurations remain the same)

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
    });

    // Save the user first, without file paths
    await newUser.save();

    // Now that the user is saved, handle file uploads
    let profilePhotoPath = null;
    let citizenshipImagePath = null;

    if (req.files['profilePhoto']) {
      const profilePhotoResult = await cloudinary.v2.uploader.upload(req.files['profilePhoto'][0].path, {
        folder: 'ClientDocuments/profilePhoto',
      });
      profilePhotoPath = profilePhotoResult.secure_url;
    }

    if (req.files['citizenshipImage']) {
      const citizenshipImageResult = await cloudinary.v2.uploader.upload(req.files['citizenshipImage'][0].path, {
        folder: 'ClientDocuments/citizenshipImage',
      });
      citizenshipImagePath = citizenshipImageResult.secure_url;
    }

    // Update user with file paths if they were uploaded
    if (profilePhotoPath || citizenshipImagePath) {
      newUser.profilePhotoPath = profilePhotoPath;
      newUser.citizenshipImagePath = citizenshipImagePath;
      await newUser.save();
    }

    // Clean up temporary files
    if (req.files['profilePhoto']) {
      fs.unlinkSync(req.files['profilePhoto'][0].path);
    }
    if (req.files['citizenshipImage']) {
      fs.unlinkSync(req.files['citizenshipImage'][0].path);
    }

    // Send welcome email
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
    // If an error occurs, clean up any uploaded files
    if (req.files['profilePhoto']) {
      fs.unlinkSync(req.files['profilePhoto'][0].path);
    }
    if (req.files['citizenshipImage']) {
      fs.unlinkSync(req.files['citizenshipImage'][0].path);
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// ... (other functions remain the same)