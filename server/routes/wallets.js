import express from 'express';
import Wallet from '../models/Wallet.js';
import auth from '../middleware/auth.js';
import { getCache, setCache, invalidateCache } from '../utils/cache.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/wallets
router.get('/', async (req, res) => {
  try {
    const cacheKey = `wallets:${req.userId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const wallets = await Wallet.find({ userId: req.userId }).sort({ createdAt: 1 });
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    
    const responseData = { wallets, totalBalance };
    setCache(cacheKey, responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Fetch wallets error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/wallets
router.post('/', async (req, res) => {
  try {
    const { name, balance, icon, color, type, logo } = req.body;

    const wallet = new Wallet({
      userId: req.userId,
      name,
      balance: balance || 0,
      icon,
      color,
      type: type || 'Tunai',
      logo: logo || ''
    });

    await wallet.save();
    invalidateCache(`wallets:${req.userId}`);
    res.status(201).json({ message: 'Dompet berhasil ditambahkan!', wallet });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Add wallet error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/wallets/:id
router.put('/:id', async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!wallet) {
      return res.status(404).json({ message: 'Dompet tidak ditemukan.' });
    }

    invalidateCache(`wallets:${req.userId}`);
    invalidateCache(`transactions:${req.userId}`);
    res.json({ message: 'Dompet berhasil diupdate!', wallet });
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/wallets/:id
router.delete('/:id', async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Dompet tidak ditemukan.' });
    }

    invalidateCache(`wallets:${req.userId}`);
    invalidateCache(`transactions:${req.userId}`);
    res.json({ message: 'Dompet berhasil dihapus!' });
  } catch (error) {
    console.error('Delete wallet error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
