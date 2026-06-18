import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import MonthSelector from '../components/MonthSelector';
import SummaryCard from '../components/SummaryCard';
import TransactionGroup from '../components/TransactionGroup';
import AddTransactionModal from '../components/AddTransactionModal';

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { transactions, summary, loading, fetchTransactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  useEffect(() => {
    fetchTransactions(month, year);
  }, [month, year, fetchTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    // Sort by date descending
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, items]) => ({ date, transactions: items }));
  }, [transactions]);

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
    if (editingTransaction) {
      await updateTransaction(editingTransaction._id, data);
    } else {
      await addTransaction(data);
    }
    fetchTransactions(month, year);
    setEditingTransaction(null);
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

      {/* Transactions List */}
      <div style={{ marginTop: '16px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="loading-spinner" />
              <p style={{ color: '#999999', fontSize: '12px' }}>Memuat transaksi...</p>
            </div>
          </div>
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
              backgroundColor: '#141414',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '30px'
            }}>
              📭
            </div>
            <p style={{ color: '#999999', fontSize: '14px', textAlign: 'center' }}>
              Belum ada transaksi bulan ini
            </p>
            <p style={{ color: 'rgba(153,153,153,0.6)', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
              Tap tombol + untuk menambah transaksi pertama
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
