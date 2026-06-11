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
  const { transactions, summary, loading, fetchTransactions, addTransaction } = useTransactions();

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

  const handleAddTransaction = async (data) => {
    await addTransaction(data);
    fetchTransactions(month, year);
  };

  return (
    <div className="flex flex-col min-h-screen">
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
      <div className="mt-5 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
              <p className="text-ink-muted text-xs">Memuat transaksi...</p>
            </div>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4"
          >
            <div className="w-20 h-20 rounded-[24px] bg-surface-1 flex items-center justify-center mb-4 text-3xl">
              📭
            </div>
            <p className="text-ink-muted text-sm text-center">
              Belum ada transaksi bulan ini
            </p>
            <p className="text-ink-muted/60 text-xs text-center mt-1">
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
              transition={{ duration: 0.3 }}
            >
              {groupedTransactions.map((group, i) => (
                <TransactionGroup
                  key={group.date}
                  date={group.date}
                  transactions={group.transactions}
                  index={i}
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

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}
