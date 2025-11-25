const express = require('express');
const router = express.Router();
const userModel = require('./models/signup_user_model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { extractToken, protect } = require('./Middleware/project');
const secretKey = process.env.JWT_SECRET || 'fallback-secret-very-long-random-string';

// ========== SIGNUP ==========
router.post('/signup', async (req, res) => {
  let { email, password } = req.body;

  // Normalize input
  email = email?.trim().toLowerCase();
  password = password?.trim();

  console.log('[SIGNUP] Request received →', { email });

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log('[SIGNUP] User already exists →', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // REMOVED MANUAL HASHING → Let Mongoose pre('save') hook do it (single hash only)
    const newUser = new userModel({
      email,
      password,                         // ← plain password here
      userName: email.split('@')[0],
    });

    await newUser.save(); // pre-save hook will hash it once

    console.log('[SIGNUP] User saved successfully →', newUser._id);

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      secretKey,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User Registered Successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.userName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('[SIGNUP] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim().toLowerCase();
  password = password?.trim();

  console.log('[LOGIN] Login attempt →', { email });

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      console.log('[LOGIN] User not found →', email);
      return res.status(404).json({ message: 'User Not Found' });
    }

    console.log('[LOGIN] User found →', user._id);
    console.log('[LOGIN] Stored hash →', user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('[LOGIN] bcrypt.compare result →', isMatch);

    if (!isMatch) {
      console.log('[LOGIN] Password mismatch for user →', user._id);
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    console.log('[LOGIN] Password correct! Generating token...');

    const token = jwt.sign(
      { id: user._id, email: user.email },
      secretKey,
      { expiresIn: '7d' }
    );

    console.log('[LOGIN] Login successful →', user._id);

    res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user._id,
        username: user.userName,
        email: user.email,
        address: user.address || null,
        phone: user.phone || null,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Server Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ========== PROTECTED ROUTE ==========
router.post('/protected', extractToken, protect, (req, res) => {
  console.log('[PROTECTED] Accessed by →', req.user._id, req.user.email);
  res.status(200).json({
    message: 'You are an authorized user',
    user: req.user,
  });
});

module.exports = router;