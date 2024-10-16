// middleware/authenticate.js
import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ message: 'Access denied, no token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Assuming your token contains the user ID in 'id' field
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

export default authenticate;




export const authenticate2 = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Extract token from header

  console.log('Incoming Token:', token); // Log the incoming token

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = decoded; // Attach decoded user info to request object
    console.log('Decoded User:', req.user); // Log the decoded user info
    next(); // Call next middleware or route handler
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Token is not valid.' });
  }
};

