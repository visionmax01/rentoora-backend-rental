import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/clientadModel.js'; // Import your User model
import dotenv from 'dotenv';


dotenv.config(); // Load environment variables from .env file

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Send OTP function
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with the provided email' });
    }

    // Generate OTP (6-digit)
    const otp = crypto.randomInt(100000, 999999).toString(); // Ensure OTP is a string

    // Save OTP and its expiry to the user model
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Create transporter for sending email
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or any other email service
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // You should also set this in your .env file
      },
    });

    // Styled email content
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Password Reset OTP',
      html: `
             <div style="text-align: left; font-family: Arial, sans-serif; max-width: 600px;   border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
          
    <h2 style="color: #4A90E2;">From Rentoora,  </h2>
    <p style="font-size: 16px; line-height: 1.5;">
      We're glad to have you with us! <br> To reset your password, please use the OTP below.
    </p>
    <div style="padding: 16px; background-color: #f4daed; border-left: 4px solid #4f46e5; margin-bottom: 16px;">
    <h3 style="font-weight: bold; font-size: 24px; color: #D9534F;">Your OTP: <span style="color: #4A90E2;">${otp}</span></h3>
    <p style="font-size: 14px; color: #888;">This OTP is valid for <strong>10 minutes</strong>.</p>
    </div>
    <p>If you didn't request this, please ignore this email.</p>
    <footer style="margin-top: 20px; font-size: 12px; color: #888;">
      &copy; ${new Date().getFullYear()} Rentoora rental service. All rights reserved.
    </footer>
  </div>

      `,
    };

    // Send email
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email', error });
      }
      res.status(200).json({ message: 'OTP sent to email', email });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Verify OTP function
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log(`Received email: ${email}, OTP: ${otp}`); // Log the incoming values

    if (!email || !otp) {
      return res.status(400).json({ message: 'OTP are required' });
    }

    const user = await User.findOne({ email });
    console.log(`User found: ${JSON.stringify(user)}`); // Log user details

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure the OTP is parsed as a string for comparison
    const otpParsed = String(otp);
    console.log(`Parsed OTP: ${otpParsed}`); // Log parsed OTP
    console.log(`Stored OTP: ${user.otp}`); // Log stored OTP for comparison
    console.log(`Current time: ${Date.now()}, OTP expiry time: ${user.otpExpiry}`); // Log expiry check

    // Check if the OTP matches
    if (String(user.otp) !== otpParsed) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if the OTP has expired
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Clear OTP after successful verification
    user.otp = null; 
    user.otpExpiry = null; 
    await user.save();

    res.status(200).json({ message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password function
// Reset password function
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    user.password = hashedPassword;
    user.otp = null; // Clear OTP after reset
    user.otpExpiry = null; // Clear OTP expiry after reset
    await user.save();

    // Send a confirmation email after successful password reset
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #4A90E2;">Password Reset Confirmation</h2>
          <p style="font-size: 16px; line-height: 1.5;">Hello <strong>${user.name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5;">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <p style="font-size: 14px; color: #888;">
            If you did not request this password reset, please contact us immediately.
          </p>
          <footer style="margin-top: 20px; font-size: 12px; color: #888;">
            &copy; ${new Date().getFullYear()} Rentoora rental service. All rights reserved.
          </footer>
        </div>
      `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Password reset confirmation email sent.');
      }
    });

    // Respond to the client
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
