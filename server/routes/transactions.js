import express from 'express';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/transactions?month=6&year=2026
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = { userId: req.userId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(filter).populate('walletId').sort({ date: -1 });
    
    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      transactions,
      summary: { income, expense, balance: income - expense }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/transactions/analytics?year=2026
router.get('/analytics', async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Category breakdown for expenses
    const categoryBreakdown = {};
    const monthlyData = {};

    transactions.forEach(t => {
      // Category breakdown
      if (t.type === 'EXPENSE') {
        if (!categoryBreakdown[t.category]) {
          categoryBreakdown[t.category] = 0;
        }
        categoryBreakdown[t.category] += t.amount;
      }

      // Monthly data
      const monthKey = t.date.getMonth();
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    // Format category breakdown as array sorted by amount
    const categories = Object.entries(categoryBreakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Format monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthly = months.map((name, i) => ({
      name,
      income: monthlyData[i]?.income || 0,
      expense: monthlyData[i]?.expense || 0
    }));

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      categories,
      monthly,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { date, type, category, amount, note, walletId } = req.body;

    const transaction = new Transaction({
      userId: req.userId,
      date: date || new Date(),
      type,
      category,
      amount,
      note,
      walletId
    });

    await transaction.save();

    // Adjust wallet balance if walletId is provided
    if (walletId) {
      const wallet = await Wallet.findOne({ _id: walletId, userId: req.userId });
      if (wallet) {
        const balanceChange = type === 'INCOME' ? Number(amount) : -Number(amount);
        wallet.balance += balanceChange;
        await wallet.save();
      }
    }

    await transaction.populate('walletId');

    res.status(201).json({ message: 'Transaksi berhasil ditambahkan!', transaction });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const oldTransaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
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

    await updatedTransaction.populate('walletId');

    res.json({ message: 'Transaksi berhasil diupdate!', transaction: updatedTransaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const oldTransaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await Transaction.deleteOne({ _id: req.params.id, userId: req.userId });

    // Revert balance change on wallet
    if (oldTransaction.walletId) {
      const wallet = await Wallet.findOne({ _id: oldTransaction.walletId, userId: req.userId });
      if (wallet) {
        const balanceChange = oldTransaction.type === 'INCOME' ? oldTransaction.amount : -oldTransaction.amount;
        wallet.balance -= balanceChange;
        await wallet.save();
      }
    }

    res.json({ message: 'Transaksi berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/transactions/import-csv
router.post('/import-csv', async (req, res) => {
  try {
    let csvPath = '';
    const possiblePaths = [
      path.join(process.cwd(), 'bajet_cashflow_20260611_131405.csv'),
      path.join(process.cwd(), '..', 'bajet_cashflow_20260611_131405.csv'),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    }

    if (!csvPath) {
      return res.status(404).json({ message: 'File CSV contoh data tidak ditemukan.' });
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');

    const transactionsToInsert = [];
    // Header: Date,Type,Category,Amount,Note
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length < 4) continue;

      const dateStr = parts[0];
      const type = parts[1];
      const category = parts[2];
      const amount = parseFloat(parts[3]);
      const note = parts[4] || '';

      if (!type || !category || isNaN(amount)) continue;

      transactionsToInsert.push({
        userId: req.userId,
        date: new Date(dateStr),
        type: type.toUpperCase(),
        category,
        amount,
        note
      });
    }

    if (transactionsToInsert.length > 0) {
      await Transaction.insertMany(transactionsToInsert);
    }

    // Ensure we create a default wallet if none exists
    const userWallets = await Wallet.find({ userId: req.userId });
    if (userWallets.length === 0) {
      const wallet = new Wallet({
        userId: req.userId,
        name: 'Dompet Utama',
        balance: 10000000, // starting balance
        icon: 'wallet',
        color: '#6a4cf5',
      });
      await wallet.save();
    }

    res.json({ message: `Berhasil mengimpor ${transactionsToInsert.length} transaksi dari CSV!`, count: transactionsToInsert.length });
  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({ message: 'Gagal mengimpor file CSV.' });
  }
});

export default router;
