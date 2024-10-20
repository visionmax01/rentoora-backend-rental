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
import { fileURLToPath } from 'url';
import paymentRouter from "./orderRoutes/paymentRoutes.js"

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

export default app;
