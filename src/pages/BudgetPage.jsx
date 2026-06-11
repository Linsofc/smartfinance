import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import api from '../api/axios';

export default function BudgetPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formatting helpers
  const formatCurrency = (amount) => {
    return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getMonthName = (date) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch budgets
        const budgetsRes = await api.get('/budgets');
        const userBudgets = budgetsRes.data || [];
        
        // Fetch transactions for current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const txRes = await api.get('/transactions');
        // Filter to get only expenses for the current month
        const currentMonthExpenses = txRes.data.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return tx.type === 'EXPENSE' && 
                 txDate >= startOfMonth && 
                 txDate <= endOfMonth;
        });

        setBudgets(userBudgets);
        setTransactions(currentMonthExpenses);
      } catch (error) {
        console.error('Failed to fetch budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate]);

  // Calculations
  const calculateCategorySpent = (categoryName) => {
    return transactions
      .filter(tx => tx.category === categoryName)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  
  // Calculate total spent only for categories that have budgets? 
  // Based on the screenshot, it shows total spent out of the budget.
  // We'll calculate spent only for categories with active budgets.
  const totalSpent = budgets.reduce((sum, b) => sum + calculateCategorySpent(b.category), 0);

  const overallProgress = totalBudget === 0 ? 0 : Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <div className="flex-1 flex flex-col pt-12 pb-24 px-6 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Anggaran</h1>
        
        <div className="flex items-center gap-4">
          <button onClick={() => changeMonth(-1)} className="text-white hover:text-ink-muted transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-medium text-sm w-24 text-center">
            {getMonthName(currentDate)}
          </span>
          <button onClick={() => changeMonth(1)} className="text-white hover:text-ink-muted transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={() => navigate('/budget/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-2 text-white hover:bg-surface-3 transition-colors"
        >
          <Settings size={22} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div 
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Main Budget Card */}
          <div className="bg-gradient-to-br from-[#6b7cff] to-[#5b6cee] rounded-3xl p-6 mb-2 shadow-lg shadow-accent-blue/20">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-white/80 text-xs font-medium mb-1">Anggaran</p>
                <h2 className="text-white text-3xl font-bold">{formatCurrency(totalBudget)}</h2>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs font-medium mb-1">Pengeluaran</p>
                <h2 className="text-white text-xl font-bold">{formatCurrency(totalSpent)}</h2>
              </div>
            </div>
            
            {/* Main Progress Bar */}
            <div className="h-2.5 bg-white/30 rounded-full overflow-hidden w-full">
              <motion.div 
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Budget List */}
          {budgets.length === 0 ? (
            <div className="text-center py-10 bg-surface-1 rounded-3xl border border-hairline-soft mt-4">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-white font-medium mb-1">Belum Ada Anggaran</h3>
              <p className="text-ink-muted text-sm px-6">Tekan tombol pengaturan (⚙️) di sudut kanan atas untuk mulai membuat anggaran Anda.</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const spent = calculateCategorySpent(budget.category);
              const progressRaw = (spent / budget.amount) * 100;
              const progress = Math.min(progressRaw, 100);
              
              // Progress bar color logic: green if under 80%, yellow if 80-100%, red if over
              let barColor = 'bg-[#22c55e]'; // Green
              if (progressRaw >= 100) barColor = 'bg-[#ff5577]'; // Red
              else if (progressRaw >= 80) barColor = 'bg-[#f59e0b]'; // Yellow

              return (
                <div key={budget._id} className="bg-[#1c1c1f] rounded-3xl p-5 border border-[#2c2c2e]">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#2c2c2e] flex items-center justify-center text-2xl shrink-0">
                      {budget.icon}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-1">
                        <h3 className="text-white font-medium text-[15px]">{budget.category}</h3>
                        <p className="text-[#8e8e93] text-[11px] font-medium font-mono">
                          {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                        </p>
                      </div>
                      
                      {/* Category Progress Bar */}
                      <div className="h-2.5 bg-[#2c2c2e] rounded-full overflow-hidden mt-1.5 w-full">
                        <motion.div 
                          className={`h-full rounded-full ${barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
