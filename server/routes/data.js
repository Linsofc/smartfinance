import express from 'express';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import Budget from '../models/Budget.js';
import Transfer from '../models/Transfer.js';

const router = express.Router();

// GET /api/data/export — Export all user data as JSON
router.get('/export', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [transactions, wallets, budgets, transfers] = await Promise.all([
      Transaction.find({ userId }).lean(),
      Wallet.find({ userId }).lean(),
      Budget.find({ userId }).lean(),
      Transfer.find({ userId }).lean(),
    ]);

    // Build a wallet ID -> name map so we can embed wallet names in transactions/transfers
    const walletMap = {};
    wallets.forEach(w => { walletMap[w._id.toString()] = w.name; });

    // Clean data: remove internal Mongo fields, embed readable wallet names
    const cleanTransactions = transactions.map(t => ({
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      note: t.note || '',
      walletName: t.walletId ? (walletMap[t.walletId.toString()] || '') : '',
    }));

    const cleanWallets = wallets.map(w => ({
      name: w.name,
      balance: w.balance,
      icon: w.icon,
      color: w.color,
      type: w.type,
    }));

    const cleanBudgets = budgets.map(b => ({
      category: b.category,
      amount: b.amount,
      icon: b.icon,
    }));

    const cleanTransfers = transfers.map(tr => ({
      fromWallet: walletMap[tr.fromWalletId?.toString()] || '',
      toWallet: walletMap[tr.toWalletId?.toString()] || '',
      amount: tr.amount,
      date: tr.date,
      note: tr.note || '',
    }));

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      user: {
        name: req.user.name,
        email: req.user.email,
      },
      summary: {
        totalTransactions: cleanTransactions.length,
        totalWallets: cleanWallets.length,
        totalBudgets: cleanBudgets.length,
        totalTransfers: cleanTransfers.length,
      },
      data: {
        wallets: cleanWallets,
        transactions: cleanTransactions,
        budgets: cleanBudgets,
        transfers: cleanTransfers,
      },
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Gagal mengekspor data.' });
  }
});

// POST /api/data/import — Import data from JSON
router.post('/import', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { data, clearExisting } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Data impor tidak ditemukan.' });
    }

    const { wallets, transactions, budgets, transfers } = data;
    const counts = { wallets: 0, transactions: 0, budgets: 0, transfers: 0 };

    // If clearExisting is true, delete all existing user data first
    if (clearExisting) {
      await Promise.all([
        Transaction.deleteMany({ userId }),
        Wallet.deleteMany({ userId }),
        Budget.deleteMany({ userId }),
        Transfer.deleteMany({ userId }),
      ]);
    }

    // 1. Import wallets first (we need their IDs for transactions/transfers)
    const walletNameToId = {};

    // If not clearing, build map from existing wallets first
    if (!clearExisting) {
      const existingWallets = await Wallet.find({ userId }).lean();
      existingWallets.forEach(w => { walletNameToId[w.name] = w._id; });
    }

    if (wallets && Array.isArray(wallets)) {
      for (const w of wallets) {
        // Skip if wallet with same name already exists
        if (walletNameToId[w.name]) continue;

        try {
          const newWallet = await Wallet.create({
            userId,
            name: w.name,
            balance: w.balance || 0,
            icon: w.icon || 'wallet',
            color: w.color || '#6a4cf5',
            type: w.type || 'Tunai',
          });
          walletNameToId[w.name] = newWallet._id;
          counts.wallets++;
        } catch (e) {
          console.warn(`Skipped wallet "${w.name}":`, e.message);
        }
      }
    }

    // 2. Import transactions
    if (transactions && Array.isArray(transactions)) {
      const txDocs = transactions.map(t => ({
        userId,
        date: t.date ? new Date(t.date) : new Date(),
        type: t.type,
        category: t.category,
        amount: t.amount,
        note: t.note || '',
        walletId: t.walletName ? walletNameToId[t.walletName] : undefined,
      })).filter(t => t.type && t.category && t.amount >= 0);

      if (txDocs.length > 0) {
        await Transaction.insertMany(txDocs, { ordered: false });
        counts.transactions = txDocs.length;
      }
    }

    // 3. Import budgets
    if (budgets && Array.isArray(budgets)) {
      for (const b of budgets) {
        try {
          await Budget.updateOne(
            { userId, category: b.category },
            { $setOnInsert: { userId, category: b.category, amount: b.amount, icon: b.icon || '💰' } },
            { upsert: true }
          );
          counts.budgets++;
        } catch (e) {
          console.warn(`Skipped budget "${b.category}":`, e.message);
        }
      }
    }

    // 4. Import transfers
    if (transfers && Array.isArray(transfers)) {
      const trDocs = transfers
        .filter(tr => tr.fromWallet && tr.toWallet && walletNameToId[tr.fromWallet] && walletNameToId[tr.toWallet])
        .map(tr => ({
          userId,
          fromWalletId: walletNameToId[tr.fromWallet],
          toWalletId: walletNameToId[tr.toWallet],
          amount: tr.amount,
          date: tr.date ? new Date(tr.date) : new Date(),
          note: tr.note || '',
        }));

      if (trDocs.length > 0) {
        await Transfer.insertMany(trDocs, { ordered: false });
        counts.transfers = trDocs.length;
      }
    }

    res.json({
      message: `Impor berhasil! ${counts.wallets} dompet, ${counts.transactions} transaksi, ${counts.budgets} anggaran, ${counts.transfers} transfer telah diimpor.`,
      counts,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ message: 'Gagal mengimpor data.' });
  }
});

export default router;
