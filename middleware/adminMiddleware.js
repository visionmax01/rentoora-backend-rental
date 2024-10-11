import jwt from 'jsonwebtoken';

const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from headers

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verify token and attach the user to the request
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET is correctly set
    req.user = decoded;

    // Check if the user has admin privileges (role 1 for admin)
    if (req.user.role !== 1) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next(); // Proceed if the user is an admin
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export default adminMiddleware;




