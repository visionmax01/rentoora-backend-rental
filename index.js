import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routers/ClientAuthRoute.js';
import Clientpost from './routers/clientPostRoutes.js'
import adminclientrouter from './routers/adminClientRoute.js';
import txtrouter from './routers/supportTicketRoute.js';
import adminRouter from './adminRoutes/adminRouter.js';
import orderRouter from './orderRoutes/rentalOrderRoutes.js'
import paymentRouter from "./orderRoutes/paymentRoutes.js"
import feadbackrouter from './routers/feedbackRoutes.js'
import Feedback from './models/Feedback.js';
import cron from 'node-cron';

dotenv.config();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Allow all origins
app.use(cors({
  origin: ['http://localhost:5173', 'https://rentoora.bhishansah.com.np'],
  credentials: true,
}));



// Connect to MongoDB
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGOURL;

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Mongoose DB Connected Successfully');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((error) => console.log('Error connecting to MongoDB:', error));

// Use the routes
app.use('/auth', authRoutes);
app.use('/count', adminclientrouter);
app.use('/api', Clientpost);
app.use('/txt', txtrouter);
app.use('/admin', adminRouter);
app.use('/order', orderRouter);
app.use('/payment', paymentRouter);
app.use('/feadback', feadbackrouter);


// Check Feedback Route
app.post('/feadback/checkFeedback', async (req, res) => {
  const { email } = req.body;

  try {
    const existingFeedback = await Feedback.findOne({ email });
    if (existingFeedback) {
      return res.status(200).json({ exists: true });
    }
    res.status(200).json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send Feedback Route
app.post('/feadback/sendFeadback', async (req, res) => {
  const { name, email, message } = req.body;

  const newFeedback = new Feedback({ name, email, message });
  
  try {
    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
});

cron.schedule('0 0 * * *', async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 2); // 2 days ago

  try {
    const result = await Feedback.deleteMany({ createdAt: { $lt: cutoffDate } });
    console.log(`Deleted ${result.deletedCount} old feedback records.`);
  } catch (error) {
    console.error('Error deleting old feedback records:', error);
  }
});
export default app;
