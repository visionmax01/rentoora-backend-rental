import jwt from 'jsonwebtoken';

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing' });
    }


    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Check for token expiration specifically
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Token expired, please log in again.' });
            }
            
            // For other JWT errors
            return res.status(403).json({ message: 'Token verification failed, please log in.' });
        }
        
        req.user = decoded;
        req.userId = decoded.id; // Assuming 'id' is part of the decoded token
        next();
    });
};

export default authenticateToken;
