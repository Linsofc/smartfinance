import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import Transfer from '../models/Transfer.js';
import Budget from '../models/Budget.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login berhasil!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/reset
router.post('/reset', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Delete all user data
    await Transaction.deleteMany({ userId });
    await Wallet.deleteMany({ userId });
    await Transfer.deleteMany({ userId });
    await Budget.deleteMany({ userId });

    res.json({ message: 'Semua data transaksi, dompet, transfer, dan anggaran Anda telah berhasil dikosongkan!' });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ message: 'Server error. Gagal mengosongkan data.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email sudah digunakan.' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      message: 'Profil berhasil diperbarui!',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui profil.' });
  }
});

// PUT /api/auth/security
router.put('/security', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru harus diisi.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password lama salah.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password berhasil diperbarui!' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Gagal memperbarui password.' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!process.env.GOOGLE_CLIENT_ID || 
        process.env.GOOGLE_CLIENT_ID === 'masukkan_client_id_google_anda_disini' || 
        process.env.GOOGLE_CLIENT_ID === 'placeholder') {
      console.warn('⚠️ Google Client ID is not configured on the backend server.');
      return res.status(400).json({ message: 'Layanan Google Login belum dikonfigurasi di server.' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      user = new User({ 
        name, 
        email, 
        password: randomPassword,
        profilePicture: picture
      });
      await user.save();
    } else if (picture && !user.profilePicture) {
      user.profilePicture = picture;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login dengan Google berhasil!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Autentikasi Google gagal.' });
  }
});

export default router;
