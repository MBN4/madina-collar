import jwt from 'jsonwebtoken';
import BlacklistedToken from '../models/BlacklistedToken.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    
    const isBlacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (isBlacklisted) {
      return res.status(401).json({ msg: 'Session expired' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token Data:", decoded); // ADDED LOG
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    console.log("Auth Middleware Error:", err.message);
    res.status(401).json({ msg: 'Session invalid' });
  }
};

export default auth;