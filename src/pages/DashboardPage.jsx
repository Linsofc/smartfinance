import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import MonthSelector from '../components/MonthSelector';
import SummaryCard from '../components/SummaryCard';
import TransactionGroup from '../components/TransactionGroup';
import AddTransactionModal from '../components/AddTransactionModal';
import { DashboardSkeleton } from '../components/Skeleton';

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { transactions, summary, loading, fetchTransactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  useEffect(() => {
    fetchTransactions(month, year);
  }, [month, year, fetchTransactions]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const filtered = searchQuery.trim()
      ? transactions.filter(t => {
          const q = searchQuery.toLowerCase();
          return (t.note?.toLowerCase().includes(q)) ||
                 (t.category?.toLowerCase().includes(q));
        })
      : transactions;

    const groups = {};
    filtered.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, items]) => ({ date, transactions: items }));
  }, [transactions, searchQuery]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleTransactionClick = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleSaveTransaction = async (data) => {
    let result;
    if (editingTransaction) {
      result = await updateTransaction(editingTransaction._id, data);
    } else {
      result = await addTransaction(data);
    }
    fetchTransactions(month, year);
    setEditingTransaction(null);

    if (result?.budgetWarnings?.length > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      result.budgetWarnings.forEach(w => {
        new Notification('Anggaran ' + w.category, {
          body: 'Telah terpakai ' + w.percentage.toFixed(0) + '% dari Rp ' + w.budget.toLocaleString(),
          icon: '/logo.png'
        });
      });
    }
  };

  const handleDeleteTransaction = async (id) => {
    await deleteTransaction(id);
    fetchTransactions(month, year);
    setModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Month Selector */}
      <MonthSelector
        month={month}
        year={year}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* Summary */}
      <SummaryCard income={summary.income} expense={summary.expense} />

      {/* Search */}
      <div className="mx-4 mt-3 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari transaksi..."
          className="w-full pl-10 pr-9 py-3 rounded-2xl bg-surface-1 border border-hairline-soft text-sm text-ink placeholder:text-ink-muted/50 outline-none transition-all focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-surface-2"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div style={{ marginTop: '16px', flex: 1 }}>
        {loading ? (
          <DashboardSkeleton />
        ) : groupedTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '30px'
            }}>              📭
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
              {searchQuery ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi bulan ini'}
            </p>
            <p style={{ color: 'rgba(100,116,139,0.6)', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
              {searchQuery ? 'Coba kata kunci lain' : 'Tap tombol + untuk menambah transaksi pertama'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${month}-${year}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {groupedTransactions.map((group, i) => (
                <TransactionGroup
                  key={group.date}
                  date={group.date}
                  transactions={group.transactions}
                  index={i}
                  onTransactionClick={handleTransactionClick}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setModalOpen(true)}
        className="fab-btn"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        transaction={editingTransaction}
      />
    </div>
  );
}
