// controllers/feedbackController.js
import Feedback from '../models/Feedback.js'

// Create new feedback
export const createFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const feedback = new Feedback({ name, email, message });
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error });
  }
};

// Get all feedbacks
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedbacks', error });
  }
};


