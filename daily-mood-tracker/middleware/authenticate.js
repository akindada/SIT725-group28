const jwt = require('jsonwebtoken');
const User = require('../models/User');
const secret = process.env.JWT_SECRET || 'secretkey';

const authenticate = async (req, res, next) => {
  console.log('Incoming Headers:', req.headers);

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Invalid authorization format' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token:', token);

  if (!token) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ msg: 'User not found or token invalid' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification error:', err.message);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
