import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataCache } from '../context/DataCacheContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const EXPENSE_CATEGORIES = [
  { name: 'Makanan', icon: '🍲', color: '#ff7a3d20' },
  { name: 'Jajanan', icon: '🍿', color: '#d44df020' },
  { name: 'Belanja', icon: '🛒', color: '#6a4cf520' },
  { name: 'Transportasi', icon: '🚗', color: '#1890ff20' },
  { name: 'Pendidikan', icon: '📚', color: '#1e904520' },
  { name: 'Hiburan', icon: '🎮', color: '#ff557720' },
  { name: 'Pajak', icon: '📋', color: '#64748b20' },
  { name: 'Hadiah', icon: '🎁', color: '#d44df020' },
  { name: 'Tarik Uang', icon: '💳', color: '#ff557720' },
  { name: 'Lainnya', icon: '📦', color: '#64748b20' }
];

export default function BudgetSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for full-screen adding/editing view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [icon, setIcon] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cache = useDataCache();

  // Custom Categories state
  const [customExpenseCategories, setCustomExpenseCategories] = useState([]);

  // Load custom categories from localStorage + auto-discover from transaction history
  useEffect(() => {
    if (!user?._id) return;
    
    const loadCategories = async () => {
      // 1. Load from localStorage
      const savedExpense = localStorage.getItem(`custom_expense_categories_${user._id}`);
      let currentExpense = savedExpense ? JSON.parse(savedExpense) : [];
      setCustomExpenseCategories(currentExpense);

      // 2. Discover custom categories from all transaction records
      try {
        const res = await api.get('/transactions');
        const txs = res.data.transactions || [];
        
        let updatedExpense = [...currentExpense];
        let changed = false;

        txs.forEach(t => {
          if (!t.category || t.type !== 'EXPENSE') return;
          
          const existsInDefault = EXPENSE_CATEGORIES.some(c => c.name === t.category);
          const existsInCustom = updatedExpense.some(c => c.name === t.category);
          if (!existsInDefault && !existsInCustom) {
            updatedExpense.push({
              name: t.category,
              icon: '📁',
              color: '#64748b20'
            });
            changed = true;
          }
        });

        if (changed) {
          setCustomExpenseCategories(updatedExpense);
          localStorage.setItem(`custom_expense_categories_${user._id}`, JSON.stringify(updatedExpense));
        }
      } catch (err) {
        console.error('Error auto-discovering categories in budget:', err);
      }
    };

    loadCategories();
  }, [user, isModalOpen]);

  const formatCurrency = (amount) => {
    return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchBudgets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await cache.fetchBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    let active = true;
    const initFetch = async () => {
      // Check cache first to avoid flashing spinner
      const cached = cache.getCacheEntry('budgets');
      if (cached) {
        setBudgets(cached.data);
        setLoading(false);
      }
      
      try {
        const data = await cache.fetchBudgets();
        if (active) {
          setBudgets(data);
        }
      } catch (error) {
        console.error('Failed to fetch budgets:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    initFetch();
    return () => {
      active = false;
    };
  }, [cache]);

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditId(budget._id);
      setCategory(budget.category);
      setAmount(budget.amount.toString());
      setIcon(budget.icon);
    } else {
      setEditId(null);
      setCategory('');
      setAmount('');
      setIcon('');
    }
    setIsModalOpen(true);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const handleSave = async () => {
    if (!category.trim() || !amount) return;
    
    setIsSubmitting(true);
    try {
      await cache.createBudget({
        category: category.trim(),
        amount: Number(amount),
        icon: icon || '📁'
      });
      setIsModalOpen(false);
      fetchBudgets(true); // silent refresh in background
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Gagal menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus anggaran ini?')) return;
    
    const previousBudgets = [...budgets];
    // Optimistic UI update - delete immediately in view
    setBudgets(prev => prev.filter(b => b._id !== id));
    
    try {
      await cache.deleteBudget(id);
      fetchBudgets(true); // silent refresh in background
    } catch (error) {
      console.error('Failed to delete budget:', error);
      setBudgets(previousBudgets); // revert on error
      alert('Gagal menghapus anggaran');
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-12 pb-8 px-6 overflow-y-auto no-scrollbar relative">
      {/* Header List */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/budget')}
            className="text-ink hover:text-ink-muted transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-heading font-bold text-ink tracking-tight">Anggaran Saya</h1>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="text-accent-blue hover:text-accent-blue/80 transition-colors"
        >
          <Plus size={28} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-10 mt-10">
          <p className="text-ink-muted text-sm">Belum ada anggaran. Tekan tombol + untuk menambahkan.</p>
        </div>
      ) : (
        <motion.div 
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {budgets.map(budget => (
            <div 
              key={budget._id} 
              className="bg-white rounded-3xl p-5 border border-hairline flex items-center justify-between cursor-pointer hover:bg-surface-2 transition-colors"
              onClick={() => handleOpenModal(budget)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-2 border border-hairline-soft flex items-center justify-center text-2xl shrink-0">
                  {budget.icon}
                </div>
                <h3 className="text-ink font-semibold text-[16px]">{budget.category}</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <p className="text-ink font-semibold font-mono text-[14px]">
                  {formatCurrency(budget.amount)}
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(budget._id); }}
                  className="w-8 h-8 flex items-center justify-center text-danger hover:bg-danger/10 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add/Edit Budget Bottom Sheet Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(8px)', 
              WebkitBackdropFilter: 'blur(8px)' 
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              className="w-full flex flex-col overflow-hidden bg-white border border-hairline rounded-t-[24px]"
              style={{ 
                height: 'auto',
                maxHeight: '85dvh',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1)'
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pull handle */}
              <div className="flex justify-center pt-3 shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-3 pt-1 border-b border-hairline-soft shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="w-8 h-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-full transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-lg font-heading font-bold text-ink">
                    {editId ? 'Edit Anggaran' : 'Tambah Anggaran'}
                  </h3>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting || !category.trim() || !amount}
                  className={`text-sm font-semibold transition-colors px-2 py-1 ${
                    !category.trim() || !amount ? 'opacity-30' : 'text-accent-blue hover:opacity-80'
                  }`}
                >
                  Simpan
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto">
                <div className="rounded-[24px] border border-hairline bg-slate-50/50 p-5">
                  <div className="flex gap-4">
                    {/* Icon display */}
                    <div className="w-12 h-12 rounded-full bg-white border border-hairline flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {icon || '📁'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Category Selector */}
                      <button
                        type="button"
                        onClick={() => setIsCategoryDrawerOpen(true)}
                        className="w-full flex items-center justify-between py-2 text-left group focus:outline-none"
                      >
                        <div>
                          <p className="text-ink-muted text-[11px] font-bold uppercase tracking-wider">Kategori</p>
                          <p className="text-ink text-sm font-semibold mt-0.5">{category || 'Pilih Kategori'}</p>
                        </div>
                        <ChevronRight size={18} className="text-ink-muted group-hover:text-ink transition-colors" />
                      </button>

                      {/* Divider */}
                      <div className="w-full border-b border-hairline-soft my-4" />

                      {/* Amount Input */}
                      <div className="relative">
                        <p className="text-ink-muted text-[11px] font-bold uppercase tracking-wider mb-2">Jumlah Anggaran</p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                          <input 
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-full bg-white border border-hairline rounded-2xl pl-10 pr-4 py-3.5 text-ink font-semibold text-sm focus:outline-none focus:border-accent-blue/50 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Picker Drawer (Bottom Sheet) */}
      <AnimatePresence>
        {isCategoryDrawerOpen && (
          <motion.div 
            className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
            onClick={() => setIsCategoryDrawerOpen(false)}
          >
            <motion.div 
              className="w-full rounded-t-[24px] border-t px-6 pt-3 pb-8 flex flex-col bg-white border-hairline"
              style={{ 
                height: '55dvh',
                maxWidth: '480px',
                boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1)'
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-1 pb-4 shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              
              <h3 className="text-lg font-heading font-bold text-ink mb-6 shrink-0">Pilih Kategori</h3>
              
              {/* Categories Grid */}
              <div 
                className="grid grid-cols-3 gap-y-6 gap-x-4 pb-8 flex-1"
                style={{ overflowY: 'auto' }}
              >
                 {[...EXPENSE_CATEGORIES, ...customExpenseCategories].map(c => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setCategory(c.name);
                      setIcon(c.icon);
                      setIsCategoryDrawerOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: c.color.endsWith('20') ? c.color : `${c.color}20` }}
                    >
                      {c.icon}
                    </div>
                    <span className="text-ink text-xs font-semibold">{c.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


