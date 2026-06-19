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

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Jumlah transaksi tidak valid.' });
    }

    // Temukan dompet berdasarkan nama (case-insensitive)
    const wallets = await Wallet.find({ userId: req.userId });
    let wallet = wallets.find(w => w.name.toLowerCase() === walletName?.toLowerCase());
    if (!wallet && wallets.length > 0) {
      wallet = wallets[0]; // fallback ke dompet pertama
    }

    if (!wallet) {
      return res.status(404).json({ message: 'Dompet tidak ditemukan.' });
    }

    const txDate = date ? new Date(date) : new Date();
    const txCategory = categoryName || (type === 'INCOME' ? 'Lainnya' : 'Lain-lain');

    const transaction = new Transaction({
      userId: req.userId,
      date: txDate,
      type: type || 'EXPENSE',
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
    console.error("AI Transaction error:", err);
    res.status(500).json({ message: 'Server error saat mencatat transaksi.' });
  }
});

// POST /api/v1/ai/transfer
router.post('/transfer', aiAuth, async (req, res) => {
  try {
    const { amount, sourceWalletName, destinationWalletName, description } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Jumlah transfer tidak valid.' });
    }

    const wallets = await Wallet.find({ userId: req.userId });
    const fromWallet = wallets.find(w => w.name.toLowerCase() === sourceWalletName?.toLowerCase());
    const toWallet = wallets.find(w => w.name.toLowerCase() === destinationWalletName?.toLowerCase());

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ message: 'Dompet asal atau tujuan tidak ditemukan.' });
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
    console.error("AI Update Transaction error:", err);
    res.status(500).json({ message: 'Server error saat memperbarui transaksi.' });
  }
});

// GET /api/v1/ai/action-instructions (Endpoint Dokumentasi Hidup)
router.get('/action-instructions', async (req, res) => {
  res.setHeader('Content-Type', 'text/markdown');
  res.send(`# Panduan API SmartFinance untuk Asisten AI

Anda adalah Asisten AI Keuangan Pribadi profesional. Anda terhubung ke API SmartFinance melalui integrasi pihak ketiga.

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

## Prinsip Utama

- Gunakan data dompet dan kategori yang ada pada konteks pengguna. Jangan berasumsi nama dompet atau kategori baru kecuali dikonfirmasi oleh pengguna.
- Laporkan saldo terbaru setelah melakukan transaksi atau transfer.
`);
});

export default router;
