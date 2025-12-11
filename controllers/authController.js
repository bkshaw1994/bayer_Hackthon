const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const register = async (req, res) => {
  try {
    const { name, userName, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { userName }] });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email or username' 
      });
    }

    // Create user
    const user = await User.create({
      name,
      userName,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          userName: user.userName,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    // Validate userName & password
    if (!userName || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide username and password' 
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ userName }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        userName: user.userName,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
