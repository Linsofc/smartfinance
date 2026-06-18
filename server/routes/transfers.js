import express from 'express';
import Transfer from '../models/Transfer.js';
import Wallet from '../models/Wallet.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/transfers
router.get('/', async (req, res) => {
  try {
    const transfers = await Transfer.find({ userId: req.userId })
      .populate('fromWalletId', 'name color icon type')
      .populate('toWalletId', 'name color icon type')
      .sort({ date: -1, createdAt: -1 });

    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/transfers
router.post('/', async (req, res) => {
  try {
    const { fromWalletId, toWalletId, amount, note, date } = req.body;

    if (!fromWalletId || !toWalletId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Informasi transfer tidak lengkap atau tidak valid.' });
    }

    if (fromWalletId === toWalletId) {
      return res.status(400).json({ message: 'Dompet asal dan tujuan tidak boleh sama.' });
    }

    // Find and verify the source wallet
    const fromWallet = await Wallet.findOne({ _id: fromWalletId, userId: req.userId });
    if (!fromWallet) {
      return res.status(404).json({ message: 'Dompet asal tidak ditemukan.' });
    }

    // Find and verify the destination wallet
    const toWallet = await Wallet.findOne({ _id: toWalletId, userId: req.userId });
    if (!toWallet) {
      return res.status(404).json({ message: 'Dompet tujuan tidak ditemukan.' });
    }

    // Deduct and add
    fromWallet.balance -= Number(amount);
    toWallet.balance += Number(amount);

    // Save wallets
    await fromWallet.save();
    await toWallet.save();

    // Create transfer record
    const transfer = new Transfer({
      userId: req.userId,
      fromWalletId,
      toWalletId,
      amount: Number(amount),
      note: note || '',
      date: date || new Date()
    });

    await transfer.save();

    res.status(201).json({ message: 'Transfer berhasil dilakukan!', transfer });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
