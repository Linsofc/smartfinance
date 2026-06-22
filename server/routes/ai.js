import express from 'express';
import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Transfer from '../models/Transfer.js';
import Budget from '../models/Budget.js';
import auth from '../middleware/auth.js';
import { invalidateCache } from '../utils/cache.js';
import { documentationMarkdown } from '../utils/documentation.js';

const router = express.Router();

// Middleware premium check
const premiumCheck = (req, res, next) => {
  const premiumEmails = process.env.AKUN_PREM
    ? process.env.AKUN_PREM.split(',').map(e => e.trim().toLowerCase())
    : [];
  
  if (!premiumEmails.includes(req.user.email?.toLowerCase())) {
    return res.status(403).json({ message: 'Fitur API & Automation hanya tersedia untuk Akun Pro.' });
  }
  next();
};

// Middleware autentikasi ganda (mendukung X-API-KEY dan token JWT bawaan)
const aiAuth = async (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    try {
      const apiKeyDoc = await ApiKey.findOne({ key: apiKeyHeader, isActive: true }).populate('userId');
      if (!apiKeyDoc || !apiKeyDoc.userId) {
        return res.status(401).json({ message: 'API Key tidak valid atau telah dinonaktifkan.' });
      }
      
      // Catat terakhir digunakan
      apiKeyDoc.lastUsed = new Date();
      await apiKeyDoc.save();

      req.userId = apiKeyDoc.userId._id;
      req.user = apiKeyDoc.userId;
      return next();
    } catch (err) {
      console.error("❌ Error autentikasi API Key:", err);
      return res.status(500).json({ message: 'Server error saat autentikasi API Key.' });
    }
  }

  // Fallback ke token JWT bawaan
  return auth(req, res, next);
};

/* ==========================================
   1. API KEYS CRUD ROUTERS (JWT Auth & Premium)
   ========================================== */

// GET /api/v1/ai/keys
router.get('/keys', auth, premiumCheck, async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(keys);
  } catch (err) {
    console.error("Fetch API Keys error:", err);
    res.status(500).json({ message: 'Server error saat memuat API Keys.' });
  }
});

// POST /api/v1/ai/keys
router.post('/keys', auth, premiumCheck, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Nama API Key harus diisi.' });
    }

    // Buat API Key unik dengan prefix 'sf_key_'
    const randomHex = crypto.randomBytes(24).toString('hex');
    const newKey = `sf_key_${randomHex}`;

    const apiKey = new ApiKey({
      userId: req.userId,
      name,
      key: newKey,
      isActive: true
    });

    await apiKey.save();
    res.status(201).json({ message: 'API Key berhasil digenerate!', apiKey });
  } catch (err) {
    console.error("Generate API Key error:", err);
    res.status(500).json({ message: 'Server error saat mengenerate API Key.' });
  }
});

// PUT /api/v1/ai/keys/:id/toggle
router.put('/keys/:id/toggle', auth, premiumCheck, async (req, res) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, userId: req.userId });
    if (!key) {
      return res.status(404).json({ message: 'API Key tidak ditemukan.' });
    }

    key.isActive = !key.isActive;
    await key.save();
    res.json({ message: `API Key berhasil ${key.isActive ? 'diaktifkan' : 'dinonaktifkan'}!`, key });
  } catch (err) {
    console.error("Toggle API Key error:", err);
    res.status(500).json({ message: 'Server error saat mengubah status API Key.' });
  }
});

// DELETE /api/v1/ai/keys/:id
router.delete('/keys/:id', auth, premiumCheck, async (req, res) => {
  try {
    const result = await ApiKey.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'API Key tidak ditemukan.' });
    }
    res.json({ message: 'API Key berhasil dihapus!' });
  } catch (err) {
    console.error("Delete API Key error:", err);
    res.status(500).json({ message: 'Server error saat menghapus API Key.' });
  }
});


/* ==========================================
   4. ENDPOINTS AI AGENT (X-API-KEY / JWT Auth)
   ========================================== */

// GET /api/v1/ai/context
router.get('/context', aiAuth, async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.userId });
    const user = await User.findById(req.userId);
    const categories = user.customCategories || [];
    const budgets = await Budget.find({ userId: req.userId });
    
    // Ambil data 10 transaksi terakhir (untuk Beranda/Home)
    const recentTransactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(10)
      .populate('walletId', 'name');

    // Ambil analisis transaksi bulan ini
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const thisMonthTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const thisMonthIncome = thisMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const thisMonthExpense = thisMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = {};
    thisMonthTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      }
    });

    res.json({
      wallets: wallets.map(w => ({ id: w._id, name: w.name, balance: w.balance, color: w.color, icon: w.icon, type: w.type })),
      categories: categories.map(c => ({ id: c._id, name: c.name, type: c.type, icon: c.icon, color: c.color })),
      budgets: budgets.map(b => ({ id: b._id, category: b.category, amount: b.amount, icon: b.icon })),
      recentTransactions: recentTransactions.map(t => ({
        id: t._id,
        date: t.date,
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.note,
        walletName: t.walletId?.name || '-'
      })),
      analytics: {
        thisMonth: {
          totalIncome: thisMonthIncome,
          totalExpense: thisMonthExpense,
          balance: thisMonthIncome - thisMonthExpense,
          expenseBreakdownByCategory: categoryBreakdown
        }
      }
    });
  } catch (err) {
    console.error("Context fetch error:", err);
    res.status(500).json({ message: 'Gagal mengambil konteks finansial.' });
  }
});

// POST /api/v1/ai/transaction
router.post('/transaction', aiAuth, async (req, res) => {
  try {
    const { type, amount, walletName, categoryName, description, date } = req.body;

    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Jumlah transaksi tidak valid.' });
    }

    // Normalisasi dan validasi type
    const txType = type ? type.toUpperCase() : 'EXPENSE';
    if (!['INCOME', 'EXPENSE'].includes(txType)) {
      return res.status(400).json({ 
        message: 'Tipe transaksi tidak valid. Harus INCOME atau EXPENSE.',
        allowedValues: ['INCOME', 'EXPENSE']
      });
    }

    // Temukan dompet berdasarkan nama (case-insensitive)
    const wallets = await Wallet.find({ userId: req.userId });
    let wallet = null;
    if (walletName) {
      wallet = wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase());
      if (!wallet) {
        return res.status(400).json({ 
          message: `Dompet dengan nama "${walletName}" tidak ditemukan.`,
          availableWallets: wallets.map(w => w.name)
        });
      }
    } else if (wallets.length > 0) {
      wallet = wallets[0];
    }

    if (!wallet) {
      return res.status(404).json({ message: 'Pengguna belum memiliki dompet. Silakan buat dompet terlebih dahulu.' });
    }

    const txDate = date ? new Date(date) : new Date();
    const txCategory = categoryName || (txType === 'INCOME' ? 'Lainnya' : 'Lain-lain');

    const transaction = new Transaction({
      userId: req.userId,
      date: txDate,
      type: txType,
      category: txCategory,
      amount: Number(amount),
      note: description || '',
      walletId: wallet._id
    });
    await transaction.save();

    // Sesuaikan saldo dompet
    const balanceChange = transaction.type === 'INCOME' ? Number(transaction.amount) : -Number(transaction.amount);
    wallet.balance += balanceChange;
    await wallet.save();

    // Invalidate caches
    invalidateCache(`transactions:${req.userId}`);
    invalidateCache(`analytics:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.status(201).json({
      message: 'Transaksi berhasil dicatat!',
      transaction,
      walletBalance: wallet.balance
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validasi gagal.', errors: messages });
    }
    console.error("AI Transaction error:", err);
    res.status(500).json({ message: 'Server error saat mencatat transaksi.' });
  }
});

// POST /api/v1/ai/transfer
router.post('/transfer', aiAuth, async (req, res) => {
  try {
    const { amount, sourceWalletName, destinationWalletName, description } = req.body;

    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Jumlah transfer tidak valid.' });
    }

    const wallets = await Wallet.find({ userId: req.userId });
    const fromWallet = wallets.find(w => w.name.toLowerCase() === sourceWalletName?.toLowerCase());
    const toWallet = wallets.find(w => w.name.toLowerCase() === destinationWalletName?.toLowerCase());

    if (!fromWallet) {
      return res.status(400).json({ 
        message: `Dompet asal "${sourceWalletName}" tidak ditemukan.`,
        availableWallets: wallets.map(w => w.name)
      });
    }

    if (!toWallet) {
      return res.status(400).json({ 
        message: `Dompet tujuan "${destinationWalletName}" tidak ditemukan.`,
        availableWallets: wallets.map(w => w.name)
      });
    }

    if (fromWallet._id.toString() === toWallet._id.toString()) {
      return res.status(400).json({ message: 'Dompet asal dan tujuan tidak boleh sama.' });
    }

    fromWallet.balance -= Number(amount);
    toWallet.balance += Number(amount);

    await fromWallet.save();
    await toWallet.save();

    const transfer = new Transfer({
      userId: req.userId,
      fromWalletId: fromWallet._id,
      toWalletId: toWallet._id,
      amount: Number(amount),
      note: description || '',
      date: new Date()
    });
    await transfer.save();

    invalidateCache(`transfers:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.status(201).json({
      message: 'Transfer berhasil dilakukan!',
      transfer,
      sourceWalletBalance: fromWallet.balance,
      destinationWalletBalance: toWallet.balance
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validasi gagal.', errors: messages });
    }
    console.error("AI Transfer error:", err);
    res.status(500).json({ message: 'Server error saat melakukan transfer.' });
  }
});

// GET /api/v1/ai/balance
router.get('/balance', aiAuth, async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.userId });
    res.json({
      wallets: wallets.map(w => ({ name: w.name, balance: w.balance, type: w.type }))
    });
  } catch (err) {
    console.error("AI Balance check error:", err);
    res.status(500).json({ message: 'Server error saat mengambil data saldo.' });
  }
});

// GET /api/v1/ai/transactions
router.get('/transactions', aiAuth, async (req, res) => {
  try {
    const { limit = 50, category, type } = req.query;
    let filter = { userId: req.userId };
    if (category) filter.category = category;
    if (type) filter.type = type.toUpperCase();

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit))
      .populate('walletId', 'name');

    res.json({
      transactions: transactions.map(t => ({
        id: t._id,
        date: t.date,
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.note,
        walletName: t.walletId?.name || '-'
      }))
    });
  } catch (err) {
    console.error("AI Fetch Transactions error:", err);
    res.status(500).json({ message: 'Server error saat mengambil daftar transaksi.' });
  }
});

// DELETE /api/v1/ai/transaction/:id (REST style)
router.delete('/transaction/:id', aiAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const oldTransaction = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await Transaction.deleteOne({ _id: id, userId: req.userId });

    // Revert balance change on wallet
    if (oldTransaction.walletId) {
      const wallet = await Wallet.findOne({ _id: oldTransaction.walletId, userId: req.userId });
      if (wallet) {
        const balanceChange = oldTransaction.type === 'INCOME' ? oldTransaction.amount : -oldTransaction.amount;
        wallet.balance -= balanceChange;
        await wallet.save();
      }
    }

    // Invalidate caches
    invalidateCache(`transactions:${req.userId}`);
    invalidateCache(`analytics:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.json({ message: 'Transaksi berhasil dihapus!' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validasi gagal.', errors: messages });
    }
    console.error("AI Delete Transaction error:", err);
    res.status(500).json({ message: 'Server error saat menghapus transaksi.' });
  }
});

// DELETE /api/v1/ai/transaction (Support query param ?id=xxx)
router.delete('/transaction', aiAuth, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'ID transaksi harus disertakan.' });
    }
    const oldTransaction = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await Transaction.deleteOne({ _id: id, userId: req.userId });

    // Revert balance change on wallet
    if (oldTransaction.walletId) {
      const wallet = await Wallet.findOne({ _id: oldTransaction.walletId, userId: req.userId });
      if (wallet) {
        const balanceChange = oldTransaction.type === 'INCOME' ? oldTransaction.amount : -oldTransaction.amount;
        wallet.balance -= balanceChange;
        await wallet.save();
      }
    }

    // Invalidate caches
    invalidateCache(`transactions:${req.userId}`);
    invalidateCache(`analytics:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.json({ message: 'Transaksi berhasil dihapus!' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validasi gagal.', errors: messages });
    }
    console.error("AI Delete Transaction error:", err);
    res.status(500).json({ message: 'Server error saat menghapus transaksi.' });
  }
});

// PUT /api/v1/ai/transaction (Support updating transaction)
router.put('/transaction', aiAuth, async (req, res) => {
  try {
    const id = req.body.id || req.body._id || req.query.id;
    if (!id) {
      return res.status(400).json({ message: 'ID transaksi harus disertakan.' });
    }

    const oldTransaction = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    // Resolve walletName to walletId if walletName is provided
    if (req.body.walletName) {
      const wallets = await Wallet.find({ userId: req.userId });
      let wallet = wallets.find(w => w.name.toLowerCase() === req.body.walletName?.toLowerCase());
      if (wallet) {
        req.body.walletId = wallet._id;
      } else {
        return res.status(400).json({
          message: `Dompet dengan nama "${req.body.walletName}" tidak ditemukan.`,
          availableWallets: wallets.map(w => w.name)
        });
      }
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    // Revert old transaction's wallet balance change
    if (oldTransaction.walletId) {
      const oldWallet = await Wallet.findOne({ _id: oldTransaction.walletId, userId: req.userId });
      if (oldWallet) {
        const oldBalanceChange = oldTransaction.type === 'INCOME' ? oldTransaction.amount : -oldTransaction.amount;
        oldWallet.balance -= oldBalanceChange;
        await oldWallet.save();
      }
    }

    // Apply new transaction's wallet balance change
    if (updatedTransaction.walletId) {
      const newWallet = await Wallet.findOne({ _id: updatedTransaction.walletId, userId: req.userId });
      if (newWallet) {
        const newBalanceChange = updatedTransaction.type === 'INCOME' ? updatedTransaction.amount : -updatedTransaction.amount;
        newWallet.balance += newBalanceChange;
        await newWallet.save();
      }
    }

    // Invalidate caches
    invalidateCache(`transactions:${req.userId}`);
    invalidateCache(`analytics:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.json({
      message: 'Transaksi berhasil diperbarui!',
      transaction: {
        id: updatedTransaction._id,
        date: updatedTransaction.date,
        type: updatedTransaction.type,
        category: updatedTransaction.category,
        amount: updatedTransaction.amount,
        description: updatedTransaction.note
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validasi gagal.', errors: messages });
    }
    console.error("AI Update Transaction error:", err);
    res.status(500).json({ message: 'Server error saat memperbarui transaksi.' });
  }
});

// PUT /api/v1/ai/transaction/:id (REST style)
router.put('/transaction/:id', aiAuth, async (req, res, next) => {
  req.query.id = req.params.id;
  next();
}, async (req, res) => {
  // Reuse the handler logic
  try {
    const id = req.query.id;
    const oldTransaction = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    if (req.body.walletName) {
      const wallets = await Wallet.find({ userId: req.userId });
      let wallet = wallets.find(w => w.name.toLowerCase() === req.body.walletName?.toLowerCase());
      if (wallet) {
        req.body.walletId = wallet._id;
      } else {
        return res.status(400).json({
          message: `Dompet dengan nama "${req.body.walletName}" tidak ditemukan.`,
          availableWallets: wallets.map(w => w.name)
        });
      }
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (oldTransaction.walletId) {
      const oldWallet = await Wallet.findOne({ _id: oldTransaction.walletId, userId: req.userId });
      if (oldWallet) {
        const oldBalanceChange = oldTransaction.type === 'INCOME' ? oldTransaction.amount : -oldTransaction.amount;
        oldWallet.balance -= oldBalanceChange;
        await oldWallet.save();
      }
    }

    if (updatedTransaction.walletId) {
      const newWallet = await Wallet.findOne({ _id: updatedTransaction.walletId, userId: req.userId });
      if (newWallet) {
        const newBalanceChange = updatedTransaction.type === 'INCOME' ? updatedTransaction.amount : -updatedTransaction.amount;
        newWallet.balance += newBalanceChange;
        await newWallet.save();
      }
    }

    invalidateCache(`transactions:${req.userId}`);
    invalidateCache(`analytics:${req.userId}`);
    invalidateCache(`wallets:${req.userId}`);

    res.json({
      message: 'Transaksi berhasil diperbarui!',
      transaction: {
        id: updatedTransaction._id,
        date: updatedTransaction.date,
        type: updatedTransaction.type,
        category: updatedTransaction.category,
        amount: updatedTransaction.amount,
        description: updatedTransaction.note
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validasi gagal.', errors: messages });
    }
    console.error("AI Update Transaction error:", err);
    res.status(500).json({ message: 'Server error saat memperbarui transaksi.' });
  }
});

/* ==========================================
   5. BUDGET ENDPOINTS FOR AI
   ========================================== */

// GET /api/v1/ai/budgets
router.get('/budgets', aiAuth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });
    res.json({
      budgets: budgets.map(b => ({
        id: b._id,
        category: b.category,
        amount: b.amount,
        icon: b.icon
      }))
    });
  } catch (err) {
    console.error("AI Budgets fetch error:", err);
    res.status(500).json({ message: 'Server error saat mengambil daftar anggaran.' });
  }
});

// POST /api/v1/ai/budget
router.post('/budget', aiAuth, async (req, res) => {
  try {
    const { categoryName, category, amount, icon } = req.body;
    const cat = categoryName || category;

    if (!cat || amount === undefined || isNaN(amount) || Number(amount) < 0) {
      return res.status(400).json({ message: 'Kategori dan jumlah anggaran yang valid harus diisi.' });
    }

    // Upsert budget
    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, category: cat },
      { amount: Number(amount), icon: icon || '💰' },
      { new: true, upsert: true, runValidators: true }
    );

    invalidateCache(`budgets:${req.userId}`);
    res.status(201).json({
      message: 'Anggaran berhasil disimpan!',
      budget: {
        id: budget._id,
        category: budget.category,
        amount: budget.amount,
        icon: budget.icon
      }
    });
  } catch (err) {
    console.error("AI Budget set error:", err);
    res.status(500).json({ message: 'Server error saat menyimpan anggaran.' });
  }
});

// DELETE /api/v1/ai/budget
router.delete('/budget', aiAuth, async (req, res) => {
  try {
    const id = req.query.id || req.body.id;
    const categoryName = req.query.categoryName || req.body.categoryName || req.query.category || req.body.category;
    
    let filter = { userId: req.userId };
    if (id) {
      filter._id = id;
    } else if (categoryName) {
      filter.category = categoryName;
    } else {
      return res.status(400).json({ message: 'ID anggaran atau Nama Kategori harus disertakan.' });
    }

    const budget = await Budget.findOneAndDelete(filter);
    if (!budget) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan.' });
    }

    invalidateCache(`budgets:${req.userId}`);
    res.json({ message: 'Anggaran berhasil dihapus!' });
  } catch (err) {
    console.error("AI Budget delete error:", err);
    res.status(500).json({ message: 'Server error saat menghapus anggaran.' });
  }
});

// DELETE /api/v1/ai/budget/:id
router.delete('/budget/:id', aiAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOneAndDelete({ _id: id, userId: req.userId });
    if (!budget) {
      return res.status(404).json({ message: 'Anggaran tidak ditemukan.' });
    }
    invalidateCache(`budgets:${req.userId}`);
    res.json({ message: 'Anggaran berhasil dihapus!' });
  } catch (err) {
    console.error("AI Budget delete param error:", err);
    res.status(500).json({ message: 'Server error saat menghapus anggaran.' });
  }
});

// GET /api/v1/ai/openapi.json
router.get('/openapi.json', async (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "SmartFinance AI API Spec",
      description: "Spesifikasi formal OpenAPI 3.0 untuk SmartFinance AI integration.",
      version: "1.1.0"
    },
    servers: [
      {
        url: "https://smartfinance.linsofc.my.id/api/v1/ai",
        description: "Server Produksi"
      },
      {
        url: "http://localhost:5000/api/v1/ai",
        description: "Server Lokal (Development)"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-KEY",
          description: "API Key untuk otorisasi integrasi AI"
        }
      }
    },
    security: [
      { ApiKeyAuth: [] }
    ],
    paths: {
      "/context": {
        get: {
          summary: "Mendapatkan Konteks Finansial",
          description: "Mengambil daftar dompet, kategori, anggaran aktif, dan riwayat transaksi terbaru.",
          responses: {
            "200": {
              description: "Berhasil mengambil konteks.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      wallets: { type: "array" },
                      categories: { type: "array" },
                      budgets: { type: "array" },
                      recentTransactions: { type: "array" },
                      analytics: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/transaction": {
        post: {
          summary: "Mencatat Transaksi Baru",
          description: "Mencatat transaksi Pemasukan (INCOME) atau Pengeluaran (EXPENSE).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["type", "amount"],
                  properties: {
                    type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                    amount: { type: "number", minimum: 1 },
                    walletName: { type: "string" },
                    categoryName: { type: "string" },
                    description: { type: "string" },
                    date: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Transaksi berhasil dicatat." },
            "400": { description: "Kesalahan input atau validasi." }
          }
        },
        put: {
          summary: "Memperbarui Transaksi",
          description: "Memperbarui detail transaksi berdasarkan ID.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id"],
                  properties: {
                    id: { type: "string" },
                    type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                    amount: { type: "number" },
                    walletName: { type: "string" },
                    categoryName: { type: "string" },
                    description: { type: "string" },
                    date: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Transaksi berhasil diperbarui." }
          }
        },
        delete: {
          summary: "Menghapus Transaksi",
          description: "Menghapus transaksi berdasarkan ID di query param.",
          parameters: [
            { name: "id", in: "query", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Transaksi berhasil dihapus." }
          }
        }
      },
      "/transaction/{id}": {
        put: {
          summary: "Memperbarui Transaksi via Path ID",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          },
          responses: {
            "200": { description: "Transaksi berhasil diperbarui." }
          }
        },
        delete: {
          summary: "Menghapus Transaksi via Path ID",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Transaksi berhasil dihapus." }
          }
        }
      },
      "/transfer": {
        post: {
          summary: "Melakukan Transfer Dana",
          description: "Memindahkan dana antar dompet pengguna.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount", "sourceWalletName", "destinationWalletName"],
                  properties: {
                    amount: { type: "number", minimum: 1 },
                    sourceWalletName: { type: "string" },
                    destinationWalletName: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Transfer dana berhasil." }
          }
        }
      },
      "/balance": {
        get: {
          summary: "Mengecek Saldo Dompet",
          responses: {
            "200": { description: "Berhasil mendapatkan saldo seluruh dompet." }
          }
        }
      },
      "/transactions": {
        get: {
          summary: "Mengambil Daftar Transaksi",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "type", in: "query", schema: { type: "string", enum: ["INCOME", "EXPENSE"] } },
            { name: "category", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Daftar transaksi berhasil diambil." }
          }
        }
      },
      "/budgets": {
        get: {
          summary: "Mengambil Daftar Anggaran",
          description: "Mendapatkan seluruh data anggaran belanja bulanan aktif pengguna.",
          responses: {
            "200": { description: "Daftar anggaran berhasil diambil." }
          }
        }
      },
      "/budget": {
        post: {
          summary: "Menyimpan/Memperbarui Anggaran",
          description: "Menetapkan limit atau mengubah nominal anggaran belanja per kategori.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["categoryName", "amount"],
                  properties: {
                    categoryName: { type: "string" },
                    amount: { type: "number" },
                    icon: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Anggaran berhasil disimpan." }
          }
        },
        delete: {
          summary: "Menghapus Anggaran",
          description: "Menghapus anggaran belanja berdasarkan ID atau Nama Kategori.",
          parameters: [
            { name: "id", in: "query", schema: { type: "string" } },
            { name: "categoryName", in: "query", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Anggaran berhasil dihapus." }
          }
        }
      },
      "/budget/{id}": {
        delete: {
          summary: "Menghapus Anggaran via ID Path",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Anggaran berhasil dihapus." }
          }
        }
      }
    }
  });
});

// GET /api/v1/ai/docs (Dokumentasi HTML Premium Dark Mode)
router.get('/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=device-width, initial-scale=1.0">
  <title>Dokumentasi API SmartFinance AI</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0f19;
      --panel-bg: rgba(17, 24, 39, 0.7);
      --accent-color: #6a4cf5;
      --accent-glow: rgba(106, 76, 245, 0.4);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --border-color: rgba(255, 255, 255, 0.08);
      --success: #10b981;
      --error: #ef4444;
      --warning: #f59e0b;
      --info: #3b82f6;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      line-height: 1.6;
      background-image: radial-gradient(circle at 10% 20%, rgba(106, 76, 245, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 40%);
      background-attachment: fixed;
    }

    header {
      border-bottom: 1px solid var(--border-color);
      padding: 2rem;
      backdrop-filter: blur(10px);
      background-color: rgba(11, 15, 25, 0.8);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #a78bfa, #6a4cf5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
    }

    .badge-api {
      background-color: rgba(106, 76, 245, 0.2);
      border: 1px solid var(--accent-color);
      color: #c084fc;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2.5rem;
    }

    .sidebar {
      position: sticky;
      top: 100px;
      height: calc(100vh - 140px);
      overflow-y: auto;
      padding-right: 1rem;
    }

    .sidebar h3 {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .sidebar-menu {
      list-style: none;
    }

    .sidebar-menu li {
      margin-bottom: 0.5rem;
    }

    .sidebar-menu a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .sidebar-menu a:hover, .sidebar-menu a.active {
      color: var(--text-main);
      background-color: rgba(255, 255, 255, 0.05);
      border-left: 3px solid var(--accent-color);
      padding-left: 0.65rem;
    }

    .method-pill-sidebar {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 4px;
      margin-right: 8px;
      min-width: 45px;
      text-align: center;
      display: inline-block;
    }

    .main-content {
      min-width: 0; /* Prevents overflow */
    }

    .card {
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    p {
      color: var(--text-muted);
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .method-pill {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .get { background-color: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
    .post { background-color: rgba(106, 76, 245, 0.15); color: #a78bfa; border: 1px solid rgba(106, 76, 245, 0.3); }
    .put { background-color: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
    .delete { background-color: rgba(239, 68, 68, 0.15); color: var(--error); border: 1px solid rgba(239, 68, 68, 0.3); }

    .endpoint-path {
      font-family: 'Fira Code', monospace;
      font-size: 1rem;
      font-weight: 500;
      color: #e2e8f0;
      background: rgba(255,255,255,0.04);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .section-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #fff, #9ca3af);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0 1.5rem;
      font-size: 0.95rem;
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      font-weight: 600;
      color: var(--text-main);
      background-color: rgba(255,255,255,0.02);
    }

    td {
      color: var(--text-muted);
    }

    .param-name {
      font-family: 'Fira Code', monospace;
      color: #a78bfa;
      font-weight: 500;
    }

    .param-type {
      font-family: 'Fira Code', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
      background: rgba(255,255,255,0.04);
      padding: 1px 4px;
      border-radius: 4px;
    }

    .required {
      color: var(--error);
      font-size: 0.75rem;
      font-weight: 600;
      background-color: rgba(239, 68, 68, 0.1);
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .code-block {
      background-color: rgba(17, 24, 39, 0.9);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
      overflow-x: auto;
      margin: 1rem 0;
      position: relative;
      color: #38bdf8;
    }

    .code-block::before {
      content: "JSON";
      position: absolute;
      top: 0.5rem;
      right: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: sans-serif;
      font-weight: 600;
    }

    .code-block.bash::before {
      content: "BASH";
    }

    .code-block.bash {
      color: #34d399;
    }

    .alert {
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid transparent;
      margin: 1.5rem 0;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .alert-info {
      background-color: rgba(59, 130, 246, 0.08);
      border-color: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
    }

    .alert-warning {
      background-color: rgba(245, 158, 11, 0.08);
      border-color: rgba(245, 158, 11, 0.2);
      color: #fde047;
    }

    .badge-status {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
    }

    .status-200 { background-color: rgba(16, 185, 129, 0.15); color: var(--success); }
    .status-400 { background-color: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .status-500 { background-color: rgba(239, 68, 68, 0.15); color: var(--error); }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg-color);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--accent-color);
    }

    @media (max-width: 900px) {
      .container {
        grid-template-columns: 1fr;
      }
      .sidebar {
        display: none;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-container">
      <div class="logo-text">SmartFinance AI Integration API</div>
      <div class="badge-api">v1.1.0</div>
    </div>
  </header>

  <div class="container">
    <div class="sidebar">
      <h3>Dokumentasi</h3>
      <ul class="sidebar-menu">
        <li><a href="#pengenalan" class="active">Pengenalan</a></li>
        <li><a href="#autentikasi">Autentikasi & Base URL</a></li>
        <li><a href="#errors">Penanganan Error AI</a></li>
      </ul>
      <h3 style="margin-top: 1.5rem;">API Endpoints</h3>
      <ul class="sidebar-menu">
        <li><a href="#get-context"><span class="method-pill-sidebar get">GET</span> /context</a></li>
        <li><a href="#post-transaction"><span class="method-pill-sidebar post">POST</span> /transaction</a></li>
        <li><a href="#post-transfer"><span class="method-pill-sidebar post">POST</span> /transfer</a></li>
        <li><a href="#get-balance"><span class="method-pill-sidebar get">GET</span> /balance</a></li>
        <li><a href="#get-transactions"><span class="method-pill-sidebar get">GET</span> /transactions</a></li>
        <li><a href="#put-transaction"><span class="method-pill-sidebar put">PUT</span> /transaction</a></li>
        <li><a href="#delete-transaction"><span class="method-pill-sidebar delete">DEL</span> /transaction</a></li>
      </ul>
    </div>

    <div class="main-content">
      <section id="pengenalan">
        <h2 class="section-title">Pengenalan</h2>
        <p>SmartFinance AI API dirancang untuk menghubungkan AI Agent otonom (seperti LLM, Telegram Bot, Custom GPTs) dengan akun finansial pengguna secara aman dan cerdas. API ini mendukung validasi yang sangat jelas serta respon self-correcting bagi AI.</p>
        
        <div class="alert alert-info">
          <strong>Tip bagi AI Agent:</strong> Sebelum melakukan instruksi mutasi dana, selalu panggil <code>GET /context</code> untuk memvalidasi nama dompet dan kategori anggaran yang ada demi menghindari kesalahan pencatatan.
        </div>
      </section>

      <section id="autentikasi" style="margin-top: 3rem;">
        <h2 class="section-title">Autentikasi & Base URL</h2>
        <p>Gunakan Base URL berikut untuk berinteraksi:</p>
        <div class="code-block bash">
Base URL: https://smartfinance.linsofc.my.id/api/v1/ai
Local Dev: http://localhost:5000/api/v1/ai
        </div>
        <p>Sertakan header <code>X-API-KEY</code> di setiap request Anda.</p>
        <div class="code-block bash">
X-API-KEY: sf_key_xxxx...
        </div>
      </section>

      <section id="errors" style="margin-top: 3rem;">
        <h2 class="section-title">Penanganan Error AI (Self-Correction)</h2>
        <p>Ketika Anda mengirim nama dompet yang salah atau tipe yang tidak didukung, server akan mengembalikan status <strong>400 Bad Request</strong> lengkap dengan daftar nama dompet yang valid:</p>
        <div class="code-block">
{
  "message": "Dompet dengan nama \\"Gopay\\" tidak ditemukan.",
  "availableWallets": ["Kas/Cash", "DANA", "BCA"]
}
        </div>
        <div class="alert alert-warning">
          <strong>Otomatisasi Agen:</strong> Jika Anda mendapatkan error 400 tentang nama dompet, harap cocokkan teks user dengan array <code>availableWallets</code> di respon, lalu ulangi request Anda secara otomatis!
        </div>
      </section>

      <section id="get-context" style="margin-top: 4rem;">
        <h2 class="section-title">GET /context</h2>
        <div class="card">
          <div class="card-title">
            <span class="method-pill get">GET</span>
            <span class="endpoint-path">/context</span>
          </div>
          <p>Mengambil data dompet pengguna, saldo aktif, anggaran kategori, serta transaksi terbaru.</p>
          
          <div class="code-block bash">
curl -H "X-API-KEY: sf_key_xxx" https://smartfinance.linsofc.my.id/api/v1/ai/context
          </div>
        </div>
      </section>

      <section id="post-transaction" style="margin-top: 4rem;">
        <h2 class="section-title">POST /transaction</h2>
        <div class="card">
          <div class="card-title">
            <span class="method-pill post">POST</span>
            <span class="endpoint-path">/transaction</span>
          </div>
          <p>Mencatat pemasukan atau pengeluaran baru.</p>

          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Tipe</th>
                <th>Keharusan</th>
                <th>Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="param-name">type</td>
                <td><span class="param-type">string</span></td>
                <td><span class="required">Wajib</span></td>
                <td><code>INCOME</code> atau <code>EXPENSE</code></td>
              </tr>
              <tr>
                <td class="param-name">amount</td>
                <td><span class="param-type">number</span></td>
                <td><span class="required">Wajib</span></td>
                <td>Nilai positif > 0</td>
              </tr>
              <tr>
                <td class="param-name">walletName</td>
                <td><span class="param-type">string</span></td>
                <td>Opsional</td>
                <td>Nama dompet (Case-Insensitive)</td>
              </tr>
              <tr>
                <td class="param-name">categoryName</td>
                <td><span class="param-type">string</span></td>
                <td>Opsional</td>
                <td>Kategori (misal: Makanan)</td>
              </tr>
              <tr>
                <td class="param-name">description</td>
                <td><span class="param-type">string</span></td>
                <td>Opsional</td>
                <td>Catatan catatan tambahan</td>
              </tr>
            </tbody>
          </table>

          <div class="code-block">
{
  "type": "EXPENSE",
  "amount": 25000,
  "walletName": "DANA",
  "categoryName": "Makanan",
  "description": "Bakso enak"
}
          </div>
        </div>
      </section>

      <section id="post-transfer" style="margin-top: 4rem;">
        <h2 class="section-title">POST /transfer</h2>
        <div class="card">
          <div class="card-title">
            <span class="method-pill post">POST</span>
            <span class="endpoint-path">/transfer</span>
          </div>
          <p>Melakukan transfer uang antar dompet.</p>

          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Tipe</th>
                <th>Keharusan</th>
                <th>Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="param-name">amount</td>
                <td><span class="param-type">number</span></td>
                <td><span class="required">Wajib</span></td>
                <td>Nilai positif > 0</td>
              </tr>
              <tr>
                <td class="param-name">sourceWalletName</td>
                <td><span class="param-type">string</span></td>
                <td><span class="required">Wajib</span></td>
                <td>Nama dompet asal</td>
              </tr>
              <tr>
                <td class="param-name">destinationWalletName</td>
                <td><span class="param-type">string</span></td>
                <td><span class="required">Wajib</span></td>
                <td>Nama dompet tujuan</td>
              </tr>
              <tr>
                <td class="param-name">description</td>
                <td><span class="param-type">string</span></td>
                <td>Opsional</td>
                <td>Catatan transfer</td>
              </tr>
            </tbody>
          </table>

          <div class="code-block">
{
  "amount": 50000,
  "sourceWalletName": "BCA",
  "destinationWalletName": "Kas/Cash",
  "description": "Tarik tunai ATM"
}
          </div>
        </div>
      </section>
    </div>
  </div>

  <script>
    // Simple active link tracker on scroll
    const links = document.querySelectorAll('.sidebar-menu a');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 150) {
          current = section.getAttribute('id');
        }
      });

      links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
          link.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>
`);
});

// GET /api/v1/ai/action-instructions (Endpoint Dokumentasi Hidup)
router.get('/action-instructions', async (req, res) => {
  res.setHeader('Content-Type', 'text/markdown');
  res.send(`# Panduan API SmartFinance untuk Asisten AI

Anda adalah Asisten AI Keuangan Pribadi profesional. Anda terhubung ke API SmartFinance melalui integrasi pihak ketiga.

## Base URL API
- Base URL Produksi: \`https://smartfinance.linsofc.my.id/api/v1/ai\`
- Base URL Lokal: \`http://localhost:5000/api/v1/ai\`

## Endpoints yang Tersedia

Semua request API harus menyertakan header \`X-API-KEY\` yang valid.

1. **Mengambil Konteks Finansial**
   - **Endpoint:** \`GET /api/v1/ai/context\`
   - **Kegunaan:** Mengambil daftar dompet, saldo, kategori, dan anggaran aktif milik pengguna.

2. **Mencatat Transaksi**
   - **Endpoint:** \`POST /api/v1/ai/transaction\`
   - **Request Body (JSON):**
     \`\`\`json
     {
       "type": "EXPENSE" | "INCOME",
       "amount": 15000,
       "walletName": "Cash",
       "categoryName": "Makanan",
       "description": "kopi di warung",
       "date": "YYYY-MM-DD" (opsional)
     }
     \`\`\`

3. **Melakukan Transfer Uang**
   - **Endpoint:** \`POST /api/v1/ai/transfer\`
   - **Request Body (JSON):**
     \`\`\`json
     {
       "amount": 100000,
       "sourceWalletName": "BCA",
       "destinationWalletName": "Cash",
       "description": "tarik tunai"
     }
     \`\`\`

4. **Melihat Saldo Dompet**
   - **Endpoint:** \`GET /api/v1/ai/balance\`

5. **Melihat Daftar Transaksi**
   - **Endpoint:** \`GET /api/v1/ai/transactions\`
   - **Query Params (opsional):** \`limit\` (default 50), \`category\`, \`type\` (EXPENSE/INCOME)

6. **Menghapus Transaksi**
   - **Endpoint:** \`DELETE /api/v1/ai/transaction/:id\` atau \`DELETE /api/v1/ai/transaction?id=ID_TRANSAKSI\`

7. **Memperbarui/Mengoreksi Transaksi**
   - **Endpoint:** \`PUT /api/v1/ai/transaction/:id\` atau \`PUT /api/v1/ai/transaction\`
   - **Request Body (JSON, opsional):** \`amount\`, \`category\`, \`description\`, \`walletName\`

8. **Melihat Anggaran Belanja**
   - **Endpoint:** \`GET /api/v1/ai/budgets\`

9. **Mengatur/Membuat Anggaran Belanja**
   - **Endpoint:** \`POST /api/v1/ai/budget\`
   - **Request Body (JSON):**
     \`\`\`json
     {
       "categoryName": "Makanan",
       "amount": 1000000,
       "icon": "🍔" (opsional)
     }
     \`\`\`

10. **Menghapus Anggaran Belanja**
    - **Endpoint:** \`DELETE /api/v1/ai/budget\` atau \`DELETE /api/v1/ai/budget/:id\`
    - **Query Params / Request Body:** \`id\` atau \`categoryName\`

## Penanganan Respon Error (Self-Correction)
- Jika Anda mengirimkan \`walletName\` yang tidak terdaftar, API akan mengembalikan status \`400 Bad Request\` dengan field \`availableWallets\` berisi daftar dompet valid. Contoh:
  \`\`\`json
  {
    "message": "Dompet dengan nama \\"Gopay\\" tidak ditemukan.",
    "availableWallets": ["Kas/Cash", "DANA", "BCA"]
  }
  \`\`\`
  Gunakan informasi \`availableWallets\` tersebut untuk mengoreksi nama dompet dan ulangi request secara otomatis.

## Prinsip Utama

- Gunakan data dompet dan kategori yang ada pada konteks pengguna. Jangan berasumsi nama dompet atau kategori baru kecuali dikonfirmasi oleh pengguna.
- Laporkan saldo terbaru setelah melakukan transaksi atau transfer.
`);
});

// GET /api/v1/ai/dokumentasi
router.get('/dokumentasi', (req, res) => {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(documentationMarkdown);
});

export default router;
