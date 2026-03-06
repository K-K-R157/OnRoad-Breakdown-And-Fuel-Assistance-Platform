const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const FuelStation = require('../models/FuelStation');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};


exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    let user;
    let Model;

    if (role === 'mechanic') {
      Model = Mechanic;
    } else if (role === 'fuelStation') {
      Model = FuelStation;
    } else {
      Model = User;
    }

    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    user = await Model.create({
      name,
      email,
      password,
      phone,
      role: role || 'user'
    });

    const token = generateToken(user._id, role || 'user');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    let Model;
    if (role === 'mechanic') {
      Model = Mechanic;
    } else if (role === 'fuelStation') {
      Model = FuelStation;
    } else {
      Model = User;
    }

    const user = await Model.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if ((role === 'mechanic' || role === 'fuelStation') && !user.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending admin approval' 
      });
    }

    const token = generateToken(user._id, role || 'user');

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};


exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};