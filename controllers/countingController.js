import User from '../models/clientadModel.js';

export const getClientCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 0 });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching client count:', error);
    res.status(500).json({ error: 'Failed to retrieve client count.' });
  }
};

