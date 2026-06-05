/**
 * authController.js
 * Controller handles registering new users, logging in existing users,
 * and generating JWT tokens.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token valid for 30 days
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_jwt_secret_key", {
    expiresIn: "30d",
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    console.log("=== Registration Attempt ===");
    console.log("Request Body:", req.body);

    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      console.log("Validation Failed: Missing fields");
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    if (password.length < 6) {
      console.log("Validation Failed: Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Validation Failed: Invalid email format");
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    // 2. Check if user already exists
    console.log("Checking for existing user with email:", email);
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("Registration Failed: User already exists");
      return res.status(400).json({ message: "User already exists with that email" });
    }

    console.log("Email value before saving:", email);

    // 3. Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      console.log("User successfully created with ID:", user._id);
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      console.log("Registration Failed: Invalid user data (creation failed silently)");
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register User MongoDB Error: ", error);
    
    // Check for MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `Duplicate field error. A user with this ${duplicateField} already exists.`
      });
    }

    res.status(500).json({ 
      message: "Server error during registration", 
      details: error.message 
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Validate credentials
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login User Error: ", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    res.json(req.user);
  } catch (error) {
    console.error("Get User Profile Error: ", error.message);
    res.status(500).json({ message: "Server error fetching user details" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
