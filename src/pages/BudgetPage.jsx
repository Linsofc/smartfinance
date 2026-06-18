import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useDataCache } from '../context/DataCacheContext';

export default function BudgetPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const cache = useDataCache();

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
      // Check if we already have cached data — if so, don't show loading
      const budgetCached = cache.getCacheEntry('budgets');
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const txKey = `transactions:${month}:${year}`;
      const txCached = cache.getCacheEntry(txKey);

      if (!budgetCached && !txCached) {
        setLoading(true);
      }

      try {
        // Fetch budgets and transactions via cache
        const [userBudgets, txData] = await Promise.all([
          cache.fetchBudgets(),
          cache.fetchTransactions(month, year)
        ]);
        
        // Filter to get only expenses for the current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const currentMonthExpenses = txData.transactions.filter(tx => {
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
  }, [currentDate, cache]);

  // Calculations
  const calculateCategorySpent = (categoryName) => {
    return transactions
      .filter(tx => tx.category === categoryName)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateCategorySpent(b.category), 0);
  const overallProgress = totalBudget === 0 ? 0 : Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
          Anggaran
        </h1>
        
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-1.5 rounded-full border border-slate-200/50">
          <button 
            onClick={() => changeMonth(-1)} 
            className="text-slate-600 hover:text-slate-800 hover:bg-white active:scale-90 p-1 rounded-full transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-slate-700 font-bold text-xs px-1.5 min-w-[80px] text-center">
            {getMonthName(currentDate)}
          </span>
          <button 
            onClick={() => changeMonth(1)} 
            className="text-slate-600 hover:text-slate-800 hover:bg-white active:scale-90 p-1 rounded-full transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button 
          onClick={() => navigate('/budget/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Settings size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div 
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Main Budget Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[24px] p-6 text-white shadow-lg shadow-blue-500/10">
            <div className="flex justify-between items-end mb-5">
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Anggaran</p>
                <h2 className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalBudget)}</h2>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Terpakai</p>
                <h2 className="text-xl font-bold">{formatCurrency(totalSpent)}</h2>
              </div>
            </div>
            
            {/* Main Progress Bar */}
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden w-full">
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
            <div className="text-center py-12 px-6 bg-white rounded-[24px] border border-slate-100 shadow-sm mt-2">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-slate-800 font-bold text-base mb-1.5">Belum Ada Anggaran</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-[280px] mx-auto">
                Tekan tombol pengaturan (⚙️) di sudut kanan atas untuk mulai membuat anggaran bulanan Anda.
              </p>
            </div>
          ) : (
            budgets.map((budget) => {
              const spent = calculateCategorySpent(budget.category);
              const progressRaw = (spent / budget.amount) * 100;
              const progress = Math.min(progressRaw, 100);
              const remaining = budget.amount - spent;
              const isOver = remaining < 0;
              
              let barColor = '#10b981'; // Green
              let textColor = 'text-emerald-600';
              let bgColor = 'bg-emerald-50';
              if (progressRaw >= 100) {
                barColor = '#ef4444'; // Red
                textColor = 'text-rose-600';
                bgColor = 'bg-rose-50';
              } else if (progressRaw >= 80) {
                barColor = '#f59e0b'; // Yellow
                textColor = 'text-amber-600';
                bgColor = 'bg-amber-50';
              }

              return (
                <div key={budget._id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                      {budget.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0">
                          <h3 className="text-slate-800 font-bold text-sm truncate">{budget.category}</h3>
                          <p className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${bgColor} ${textColor}`}>
                            {isOver ? `Over ${formatCurrency(Math.abs(remaining))}` : `Tersisa ${formatCurrency(remaining)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-800 font-bold text-xs">
                            {formatCurrency(spent)}
                          </p>
                          <p className="text-slate-400 text-[10px] font-semibold mt-0.5">
                            dari {formatCurrency(budget.amount)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Category Progress Bar */}
                      <div className="h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden w-full mt-2">
                        <motion.div 
                          className="h-full rounded-full"
                          style={{ backgroundColor: barColor }}
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
