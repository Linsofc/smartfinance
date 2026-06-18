import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataCache } from '../context/DataCacheContext';

const EXPENSE_CATEGORIES = [
  { name: 'Makanan', icon: '🍛', color: '#3b2323' },
  { name: 'Transportasi', icon: '🚗', color: '#3d2b1a' },
  { name: 'Belanja', icon: '🛍️', color: '#183d34' },
  { name: 'Hiburan', icon: '🎬', color: '#3d2b1a' },
  { name: 'Kesehatan', icon: '🏥', color: '#1a303d' },
  { name: 'Utilitas', icon: '💡', color: '#2b1a3d' },
  { name: 'Pendidikan', icon: '🎓', color: '#183d34' },
  { name: 'Tabungan', icon: '🏦', color: '#3d1a30' },
  { name: 'Hadiah', icon: '🎁', color: '#183d34' },
];

export default function BudgetSettingsPage() {
  const navigate = useNavigate();
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

  const formatCurrency = (amount) => {
    return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await cache.fetchBudgets({ force: true });
      setBudgets(data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

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
      fetchBudgets();
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Gagal menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus anggaran ini?')) return;
    
    try {
      await cache.deleteBudget(id);
      fetchBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
      alert('Gagal menghapus anggaran');
    }
  };

  if (isModalOpen) {
    return (
      <div className="flex-1 flex flex-col pt-12 pb-8 px-6 bg-[#090909] relative h-full">
        {/* Header Add Budget */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="text-white hover:text-ink-muted transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {editId ? 'Edit Anggaran' : 'Tambah Anggaran'}
            </h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !category.trim() || !amount}
            className={`text-[15px] font-semibold transition-colors ${
              !category.trim() || !amount ? 'text-[#3a3a3c]' : 'text-[#7b78ff] hover:text-white'
            }`}
          >
            Simpan
          </button>
        </div>

        {/* Main Form Card */}
        <div 
          className="rounded-[24px] border p-5 pt-6"
          style={{ backgroundColor: '#1c1c1f', borderColor: '#2c2c2e' }}
        >
          <div className="flex">
            {/* Left Icon */}
            <div className="text-[28px] w-14 text-center shrink-0 pt-0.5">
              {icon || '📁'}
            </div>
            
            {/* Right Content */}
            <div className="flex-1">
              {/* Kategori */}
              <div 
                className="flex items-center justify-between pb-5 cursor-pointer group"
                onClick={() => setIsCategoryDrawerOpen(true)}
              >
                <div>
                  <p className="text-[#8e8e93] text-[13px] font-medium mb-0.5">Kategori</p>
                  <p className="text-[#e5e5ea] text-[16px] font-medium">{category || 'Pilih Kategori'}</p>
                </div>
                <ChevronRight size={20} className="text-[#8e8e93] group-hover:text-[#e5e5ea] transition-colors mr-2" />
              </div>

              {/* Horizontal Line Divider */}
              <div 
                className="w-full mb-6" 
                style={{ height: '1px', backgroundColor: '#2c2c2e' }} 
              />

              {/* Jumlah Input (Floating Label style) */}
              <div className="relative mb-2">
                <div 
                  className="absolute -top-2.5 left-3 px-1.5 z-10"
                  style={{ backgroundColor: '#1c1c1f' }}
                >
                  <span className="text-[#8e8e93] text-[12px] font-medium">Jumlah</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#e5e5ea] font-mono text-[16px]">Rp</span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full bg-transparent border rounded-xl pl-12 pr-4 py-4 text-white font-mono text-[17px] focus:outline-none transition-colors"
                    style={{ borderColor: '#2c2c2e' }}
                    onFocus={(e) => e.target.style.borderColor = '#7b78ff'}
                    onBlur={(e) => e.target.style.borderColor = '#2c2c2e'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Picker Drawer (Bottom Sheet) */}
        <AnimatePresence>
          {isCategoryDrawerOpen && (
            <motion.div 
              className="fixed inset-0 z-[100] flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              onClick={() => setIsCategoryDrawerOpen(false)}
            >
              <motion.div 
                className="w-full rounded-t-[32px] border-t px-6 pt-3 pb-8 flex flex-col"
                style={{ height: '70dvh', backgroundColor: '#1c1c1f', borderColor: '#2c2c2e' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="flex justify-center mb-5 shrink-0">
                  <div className="w-12 h-1.5 rounded-full bg-[#48484a]" />
                </div>
                
                <h3 className="text-[22px] font-bold text-white mb-8 shrink-0 tracking-tight">Pilih Kategori</h3>
                
                {/* Categories Grid */}
                <div 
                  className="grid grid-cols-3 gap-y-8 gap-x-4 pb-8 flex-1"
                  style={{ overflowY: 'auto' }}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setCategory(c.name);
                        setIcon(c.icon);
                        setIsCategoryDrawerOpen(false);
                      }}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div 
                        className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[28px] group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.icon}
                      </div>
                      <span className="text-[#e5e5ea] text-[13px] font-medium">{c.name}</span>
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

  return (
    <div className="flex-1 flex flex-col pt-12 pb-8 px-6 overflow-y-auto no-scrollbar">
      {/* Header List */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/budget')}
            className="text-white hover:text-ink-muted transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Anggaran Saya</h1>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="text-[#7b78ff] hover:text-white transition-colors"
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
              className="bg-[#1c1c1f] rounded-3xl p-5 border border-[#2c2c2e] flex items-center justify-between cursor-pointer hover:bg-[#2c2c2e] transition-colors"
              onClick={() => handleOpenModal(budget)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#2c2c2e] flex items-center justify-center text-2xl shrink-0">
                  {budget.icon}
                </div>
                <h3 className="text-white font-medium text-[16px]">{budget.category}</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <p className="text-white font-medium font-mono text-[14px]">
                  {formatCurrency(budget.amount)}
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(budget._id); }}
                  className="w-8 h-8 flex items-center justify-center text-[#ff5577] hover:bg-[#ff5577]/20 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
