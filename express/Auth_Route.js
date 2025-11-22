const express = require('express');
const cors = require('cors');
const app = express.Router();

const userModel = require('./models/signup_user_model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { extractToken, protect } = require('./Middleware/project');
const secretKey = process.env.JWT_SECRET;


app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}))


// ✅ Signup Route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const newUser = new userModel({
      email,
      password,
      userName: email.split('@')[0],
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, secretKey, {
      expiresIn: '500s',
    });

    res.status(201).json({
      message: 'User Registered Successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.userName || null,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.log(`Signup Error: ${error}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, secretKey, {
      expiresIn: '500s',
    });

    res.status(200).json({
      message: 'Login Successful',
      token,
      user: {
        id: user._id,
        username: user.userName,
        email: user.email,
        address: user.address,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.log(`Login Error: ${error}`);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ✅ Protected Route
app.post('/protected', extractToken, protect, (req, res) => {
  res.status(200).json({
    message: 'You are an authorized user',
    user: req.user,
  });
});

module.exports = app;
