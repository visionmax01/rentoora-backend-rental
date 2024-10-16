import jwt from 'jsonwebtoken';

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing' });
    }

    console.log("Received token:", token); // Debugging log

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Token verification failed:", err);
            return res.status(403).json({ message: 'Token verification failed please Login' });
        }
        req.user = decoded;
        req.userId = decoded.id;
        next();
    });
};


export default authenticateToken;
