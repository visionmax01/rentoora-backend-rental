// userController.js
import User from '../models/clientadModel.js'; 
import nodemailer from 'nodemailer';
import Feedback from '../models/Feedback.js'; 



export const getRecentUsers = async (req, res) => {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  try {
    const recentUsers = await User.find({ createdAt: { $gte: twoDaysAgo } });
    res.status(200).json(recentUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};




export const sendFeedbackEmails = async (req, res) => {
  const { userIds } = req.body; // Expecting an array of user IDs
  const users = await User.find({ _id: { $in: userIds } });

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    for (const user of users) {
      // Check if feedback already exists for this user's email
      const existingFeedback = await Feedback.findOne({ email: user.email });
      if (existingFeedback) {
        return res.status(400).json({ message: 'Your feedback has already been submitted with this email.' });
      }

      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: user.email,
        subject: 'We Value Your Feedback!',
        html: `
        <div style="font-family: 'Arial', sans-serif; padding: 20px;">
          <div style="max-width: 600px; background-color: #fceded; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <div style="padding: 20px; text-align: center; background-color: #4f46e5; color: #fafafa;">
              <h1 style="font-size: 24px; font-weight: 600; margin: 0;">Welcome to Rentoora.com!</h1>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 16px;">Hi <strong>${user.name}</strong>,</p>
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 16px;">
                Thank you for joining us! We would love to hear your thoughts. Please fill out the feedback form at the link below:
              </p>
              <p>Your feedback is valuable for us!</p>
              <p style="font-size: 16px; margin-bottom: 16px;">
                <a href="https://rentoora.bhishansah.com.np/feadBackform" style="color: #4f46e5; text-decoration: underline;">Feedback Form</a>
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
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ message: 'Feedback emails sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending emails', error: error.message });
  }
};



