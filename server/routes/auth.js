import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// JWT Token Generator
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret_for_much_dev',
    { expiresIn: '7d' }
  );
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'member';

    const user = new User({
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current User profile info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Google OAuth Redirect
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = 'http://localhost:5001/api/auth/google/callback';
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
  res.redirect(url);
});

// GitHub OAuth Redirect
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const redirectUri = 'http://localhost:5001/api/auth/github/callback';
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  res.redirect(url);
});

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Google OAuth authorization code is missing.');
    }

    // Exchange code for Google Access Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: 'http://localhost:5001/api/auth/google/callback',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData);
      return res.status(400).send(`Google Token Exchange Failed: ${tokenData.error_description || tokenData.error}`);
    }

    // Fetch User Profile from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();

    const email = userData.email;
    if (!email) {
      return res.status(400).send('Email address not shared by Google OAuth.');
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'admin' : 'member';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), salt);
      user = new User({ email, password: hashedPassword, role });
      await user.save();
    }

    if (user.status === 'suspended') {
      return res.status(403).send('Your account has been suspended. Please contact the administrator.');
    }

    // Generate system JWT and redirect back to client dashboard
    const token = generateToken(user._id);
    res.redirect(`http://localhost:5173/?token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).send('Authentication failed due to a server error.');
  }
});

// GitHub OAuth Callback
router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('GitHub OAuth authorization code is missing.');
    }

    // Exchange code for GitHub Access Token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json' 
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        code,
        redirect_uri: 'http://localhost:5001/api/auth/github/callback'
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData);
      return res.status(400).send(`GitHub Token Exchange Failed: ${tokenData.error_description || tokenData.error}`);
    }

    // Fetch user details from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 
        'Authorization': `token ${tokenData.access_token}`,
        'User-Agent': 'much-app'
      }
    });
    const userData = await userResponse.json();

    let email = userData.email;
    
    // If GitHub email is private, fetch from emails endpoint
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { 
          'Authorization': `token ${tokenData.access_token}`,
          'User-Agent': 'much-app'
        }
      });
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        const primary = emails.find(e => e.primary && e.verified);
        email = primary ? primary.email : (emails[0] ? emails[0].email : null);
      }
    }

    if (!email) {
      return res.status(400).send('Email address not shared by GitHub OAuth.');
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'admin' : 'member';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), salt);
      user = new User({ email, password: hashedPassword, role });
      await user.save();
    }

    if (user.status === 'suspended') {
      return res.status(403).send('Your account has been suspended. Please contact the administrator.');
    }

    // Generate system JWT and redirect back to client dashboard
    const token = generateToken(user._id);
    res.redirect(`http://localhost:5173/?token=${token}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).send('Authentication failed due to a server error.');
  }
});

export default router;
