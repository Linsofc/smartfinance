import express from 'express';
import Transfer from '../models/Transfer.js';
import Wallet from '../models/Wallet.js';
import auth from '../middleware/auth.js';
import { getCache, setCache, invalidateCache } from '../utils/cache.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/transfers
router.get('/', async (req, res) => {
  try {
    const cacheKey = `transfers:${req.userId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const transfers = await Transfer.find({ userId: req.userId })
      .populate('fromWalletId', 'name color icon type logo')
      .populate('toWalletId', 'name color icon type logo')
      .sort({ date: -1, createdAt: -1 });

    setCache(cacheKey, transfers);
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

    // Check for sufficient balance
    if (fromWallet.balance < Number(amount)) {
      return res.status(400).json({ message: 'Saldo dompet asal tidak mencukupi.' });
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

    try {
      await transfer.save();
    } catch (saveError) {
      // Rollback wallet balances on transfer save failure
      fromWallet.balance += Number(amount);
      toWallet.balance -= Number(amount);
      await fromWallet.save();
      await toWallet.save();
      console.error('Transfer save failed, balances rolled back:', saveError);
      return res.status(500).json({ message: 'Gagal menyimpan transfer. Saldo telah dikembalikan.' });
    }
    invalidateCache(`transfers:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.status(201).json({ message: 'Transfer berhasil dilakukan!', transfer });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;

