import express from 'express';
import Budget from '../models/Budget.js';
import auth from '../middleware/auth.js';
import { getCache, setCache, invalidateCache } from '../utils/cache.js';

const router = express.Router();

// Apply auth middleware to all budget routes
router.use(auth);

// @desc    Get all budgets for logged in user
// @route   GET /api/budgets
// @access  Private
router.get('/', async (req, res) => {
  try {
    const cacheKey = `budgets:${req.userId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const budgets = await Budget.find({ userId: req.userId });
    setCache(cacheKey, budgets);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data anggaran', error: error.message });
  }
});

// @desc    Set or update a budget
// @route   POST /api/budgets
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { category, amount, icon } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({ message: 'Kategori dan jumlah harus diisi' });
    }

    // Upsert budget (update if exists, insert if not)
    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, category },
      { amount, icon: icon || '💰' },
      { new: true, upsert: true, runValidators: true }
    );

    invalidateCache(`budgets:${req.userId}`);
    res.status(200).json(budget);
  } catch (error) {
    res.status(400).json({ message: 'Gagal menyimpan anggaran', error: error.message });
  }
});

// @desc    Delete a budget
// @route   DELETE /api/budgets/:categoryId
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.userId 
    });

    if (!budget) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan' });
    }

    invalidateCache(`budgets:${req.userId}`);
    res.json({ message: 'Anggaran berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus anggaran', error: error.message });
  }
});

export default router;
