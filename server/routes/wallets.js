import express from 'express';
import Wallet from '../models/Wallet.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/wallets
router.get('/', async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.userId }).sort({ createdAt: 1 });
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    
    res.json({ wallets, totalBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/wallets
router.post('/', async (req, res) => {
  try {
    const { name, balance, icon, color } = req.body;

    const wallet = new Wallet({
      userId: req.userId,
      name,
      balance: balance || 0,
      icon,
      color
    });

    await wallet.save();
    res.status(201).json({ message: 'Dompet berhasil ditambahkan!', wallet });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
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

    res.json({ message: 'Dompet berhasil diupdate!', wallet });
  } catch (error) {
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

    res.json({ message: 'Dompet berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
