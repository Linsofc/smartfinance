import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Plus, X } from 'lucide-react';
import { useDataCache } from '../context/DataCacheContext';

const INCOME_CATEGORIES = [
  { name: 'Gaji', icon: '💼', color: '#ff7a3d' },
  { name: 'Pekerja Lepas', icon: '💻', color: '#1890ff' },
  { name: 'Investasi', icon: '📈', color: '#1e9045' },
  { name: 'Hadiah Diterima', icon: '🎁', color: '#d44df0' },
  { name: 'Bisnis', icon: '🏪', color: '#6a4cf5' },
  { name: 'Bonus', icon: 'blank', color: '#ff5577' },
  { name: 'UANG BULANAN', icon: '💰', color: '#1e9045' },
  { name: 'Lainnya', icon: '🛍️', color: '#64748b' },
  { name: 'terima', icon: '💳', color: '#f59e0b' }
];

const EXPENSE_CATEGORIES = [
  { name: 'Makanan', icon: '🍲', color: '#ff7a3d' },
  { name: 'Jajanan', icon: '🍿', color: '#d44df0' },
  { name: 'Belanja', icon: '🛒', color: '#6a4cf5' },
  { name: 'Transportasi', icon: '🚗', color: '#1890ff' },
  { name: 'Pendidikan', icon: '📚', color: '#1e9045' },
  { name: 'Hiburan', icon: '🎮', color: '#ff5577' },
  { name: 'Pajak', icon: '📋', color: '#64748b' },
  { name: 'Hadiah', icon: '🎁', color: '#d44df0' },
  { name: 'Tarik Uang', icon: '💳', color: '#ff5577' },
  { name: 'Lainnya', icon: '📦', color: '#64748b' }
];

const EMOJI_DICTIONARY = {
  'Smiley': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','😗','😙','😚','☺️','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱'],
  'Hewan': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿','🦔'],
  'Makanan': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','☕','🍵','🧃','🥤','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂'],
  'Aktivitas': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩']
};

export default function AddTransactionModal({ isOpen, onClose, onSubmit, onDelete, transaction }) {
  const [type, setType] = useState('INCOME'); // Defaulting to INCOME to match the first mockup screen
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Wallets & Drawers state
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);

  // Custom Categories
  const [customIncomeCategories, setCustomIncomeCategories] = useState([]);
  const [customExpenseCategories, setCustomExpenseCategories] = useState([]);
  const [showAddCustomCategory, setShowAddCustomCategory] = useState(false);
  const [newCustomCategoryName, setNewCustomCategoryName] = useState('');
  const [newCustomCategoryIcon, setNewCustomCategoryIcon] = useState('✈️');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('Smiley');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 480);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch wallets on modal open
  const cache = useDataCache();
  useEffect(() => {
    if (isOpen) {
      const fetchWallets = async () => {
        try {
          const data = await cache.fetchWallets();
          setWallets(data.wallets);
          if (transaction) {
            const transWalletId = typeof transaction.walletId === 'object' ? transaction.walletId._id : transaction.walletId;
            const matchedWallet = data.wallets.find(w => w._id === transWalletId);
            if (matchedWallet) {
              setSelectedWallet(matchedWallet);
            }
          } else if (data.wallets.length > 0) {
            // Default to Dompet Utama if present, else first wallet
            const defaultWallet = data.wallets.find(w => w.name === 'Dompet Utama') || data.wallets[0];
            setSelectedWallet(defaultWallet);
          }
        } catch (err) {
          console.error('Error fetching wallets in modal:', err);
        }
      };
      fetchWallets();
    }
  }, [isOpen, transaction, cache]);

  // Handle setting transaction edit state values
  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      if (transaction) {
        setType(transaction.type || 'INCOME');
        setCategory(transaction.category || '');
        setAmount(String(transaction.amount || ''));
        setNote(transaction.note || '');
        setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      } else {
        setType('INCOME');
        setCategory('');
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().split('T')[0]);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen, transaction]);

  const allCategories = type === 'INCOME' 
    ? [...INCOME_CATEGORIES, ...customIncomeCategories] 
    : [...EXPENSE_CATEGORIES, ...customExpenseCategories];

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const handleAddCustomCategory = () => {
    if (!newCustomCategoryName.trim()) return;
    const newCat = {
      name: newCustomCategoryName.trim(),
      icon: newCustomCategoryIcon,
      color: '#1890ff'
    };
    if (type === 'INCOME') {
      setCustomIncomeCategories([...customIncomeCategories, newCat]);
    } else {
      setCustomExpenseCategories([...customExpenseCategories, newCat]);
    }
    setCategory(newCat.name);
    setNewCustomCategoryName('');
    setShowAddCustomCategory(false);
    setCategoryDrawerOpen(false);
    setShowIconPicker(false);
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dayName = days[dateObj.getDay()];
    const day = dateObj.getDate();
    const monthName = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${monthName} ${year} (${dayName})`;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!category) { setError('Pilih kategori terlebih dahulu'); return; }
    if (!amount || Number(amount) <= 0) { setError('Masukkan jumlah yang valid'); return; }
    if (!selectedWallet) { setError('Pilih dompet terlebih dahulu'); return; }
    
    setLoading(true);
    try {
      // 1. Submit transaction with walletId
      await onSubmit({ 
        type, 
        category, 
        amount: Number(amount), 
        note, 
        date: new Date(date).toISOString(),
        walletId: selectedWallet._id
      });

      // Reset form fields
      setCategory('');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleBackAndReset = () => {
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ 
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 60,
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'flex-end',
            justifyContent: 'center',
            padding: isDesktop ? '24px' : '0px'
          }}
        >
          {/* Main Transaction Form Sheet */}
          <motion.div
            className="w-full flex flex-col overflow-hidden relative"
            initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
            animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
            exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
            transition={isDesktop ? { duration: 0.15 } : { type: 'spring', damping: 28, stiffness: 280 }}
            style={{ 
              backgroundColor: '#FFFFFF',
              border: '1px solid #e2e8f0',
              borderBottom: isDesktop ? '1px solid #e2e8f0' : 'none',
              borderRadius: isDesktop ? '28px' : '28px 28px 0 0',
              color: '#1e293b',
              height: isDesktop ? '100%' : '100dvh',
              maxHeight: isDesktop ? '85dvh' : '100dvh',
              maxWidth: '480px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 py-4 shrink-0"
              style={{ borderBottom: '1px solid #e2e8f0' }}
            >
              <button
                type="button"
                onClick={handleBackAndReset}
                className="w-10 h-10 flex items-center justify-center text-ink rounded-full hover:bg-surface-2 transition-colors"
              >
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-base font-heading font-bold tracking-tight text-ink">{transaction ? 'Ubah Transaksi' : 'Tambah Transaksi'}</h2>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !amount || Number(amount) <= 0 || !category || !selectedWallet}
                className="text-sm font-semibold text-accent-blue hover:opacity-85 disabled:opacity-30 transition-opacity px-2"
              >
                {transaction ? 'Ubah' : 'Simpan'}
              </button>
            </div>

            {/* Content Body */}
            <div 
              className="px-4 py-6 space-y-6"
              style={{
                overflowY: 'auto',
                minHeight: '0',
                flex: '1 1 0%',
                maxHeight: 'calc(100% - 73px)'
              }}
            >
              {/* Rp Amount Display & Invisible Input overlay */}
              <div className="flex flex-col items-center justify-center py-12 relative">
                <div className="flex items-center justify-center select-none cursor-pointer">
                  <span className="text-4xl font-semibold mr-2" style={{ color: '#94a3b8' }}>Rp</span>
                  <span 
                    className="text-6xl font-bold tracking-tight font-heading" 
                    style={{ 
                      color: amount ? '#1e293b' : '#94a3b8'
                    }}
                  >
                    {amount ? Number(amount).toLocaleString('id-ID') : '0'}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="absolute inset-0 cursor-pointer text-center w-full focus:ring-0 focus:outline-none"
                  style={{ 
                    opacity: 0, 
                    backgroundColor: 'transparent', 
                    border: 'none',
                    zIndex: 10
                  }}
                  autoFocus
                />
              </div>

              {/* Type Toggle Switch (Pemasukan / Pengeluaran) */}
              <div 
                className="p-1 rounded-full flex max-w-xs mx-auto"
                style={{ 
                  backgroundColor: '#f1f5f9', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                <button
                  type="button"
                  onClick={() => { setType('INCOME'); setCategory(''); }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all text-center"
                  style={{
                    backgroundColor: type === 'INCOME' ? '#1890ff' : 'transparent',
                    color: type === 'INCOME' ? '#ffffff' : '#64748b'
                  }}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => { setType('EXPENSE'); setCategory(''); }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all text-center"
                  style={{
                    backgroundColor: type === 'EXPENSE' ? '#1890ff' : 'transparent',
                    color: type === 'EXPENSE' ? '#ffffff' : '#64748b'
                  }}
                >
                  Pengeluaran
                </button>
              </div>

              {/* Fields List Container */}
              <div 
                className="rounded-[24px] overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0'
                }}
              >
                {/* Category Selector Row */}
                <button
                  type="button"
                  onClick={() => setCategoryDrawerOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors text-left"
                  style={{ borderBottom: '1px solid #e2e8f0' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg">
                      📁
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Kategori</p>
                      <p className={`text-sm font-semibold mt-0.5 ${category ? 'text-ink' : 'text-ink-muted/50'}`}>
                        {category || 'Pilih Kategori'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink-muted" />
                </button>

                {/* Date Selector Row with Overlay Input */}
                <div 
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors relative text-left"
                  style={{ borderBottom: '1px solid #e2e8f0' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 text-lg">
                      📅
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Tanggal</p>
                      <p className="text-sm font-semibold text-ink mt-0.5">
                        {formatDateIndo(date)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink-muted" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="absolute inset-0 cursor-pointer"
                    style={{ 
                      opacity: 0, 
                      backgroundColor: 'transparent',
                      border: 'none',
                      zIndex: 20
                    }}
                  />
                </div>

                {/* Wallet Selector Row */}
                <button
                  type="button"
                  onClick={() => setWalletDrawerOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 text-lg">
                      👛
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Dompet</p>
                      <p className={`text-sm font-semibold mt-0.5 ${selectedWallet ? 'text-ink' : 'text-ink-muted/50'}`}>
                        {selectedWallet ? selectedWallet.name : 'Pilih dompet'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink-muted" />
                </button>
              </div>

              {/* Note Text Box */}
              <div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan"
                  rows={3}
                  className="w-full rounded-2xl p-4 text-sm resize-none focus:outline-none text-ink bg-white border border-hairline focus:border-accent-blue/50 transition-colors"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-danger text-xs text-center font-medium bg-danger/10 py-3 px-4 rounded-xl border border-danger/20">
                  {error}
                </div>
              )}

              {transaction && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => onDelete(transaction._id)}
                  className="w-full py-3.5 bg-danger/15 border border-danger/30 hover:bg-danger/20 text-danger text-sm font-semibold rounded-2xl transition-colors shrink-0"
                >
                  Hapus Transaksi
                </motion.button>
              )}

              {/* Bottom Action Button (Now properly inside scrollable area) */}
              <div className="pt-6 pb-4">
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !amount || Number(amount) <= 0 || !category || !selectedWallet}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-full text-sm font-bold transition-all"
                  style={{
                    backgroundColor: (loading || !amount || Number(amount) <= 0 || !category || !selectedWallet) ? '#e2e8f0' : '#1890ff',
                    color: (loading || !amount || Number(amount) <= 0 || !category || !selectedWallet) ? '#94a3b8' : '#ffffff',
                    cursor: (loading || !amount || Number(amount) <= 0 || !category || !selectedWallet) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Menyimpan...' : (transaction ? 'Ubah Transaksi' : 'Simpan')}
                </motion.button>
              </div>
            </div>

            {/* BOTTOM SHEETS / DRAWERS */}
            
            {/* Category selection Drawer */}
            <AnimatePresence>
              {categoryDrawerOpen && (
                <motion.div
                  className="absolute inset-0 z-50 flex items-end justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setCategoryDrawerOpen(false)}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                  }}
                >
                  <motion.div
                    className="w-full rounded-t-[28px] flex flex-col overflow-hidden"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    style={{ 
                      backgroundColor: '#ffffff',
                      borderTop: '1px solid #e2e8f0',
                      color: '#1e293b',
                      maxHeight: '85dvh',
                      height: '100%',
                      borderRadius: isDesktop ? '28px' : '28px 28px 0 0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Fixed Header */}
                    <div className="p-6 pb-2 shrink-0">
                      {/* Pull Handle bar */}
                      <div className="flex justify-center mb-4">
                        <div className="w-10 h-1 rounded-full bg-slate-200" />
                      </div>

                      <div className="flex items-center justify-between">
                        {showIconPicker ? (
                          <div className="flex items-center gap-3">
                            <button
                               type="button"
                               onClick={() => setShowIconPicker(false)}
                               className="w-8 h-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-full transition-colors"
                            >
                              <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-lg font-heading font-bold text-ink">Pilih Emoji</h3>
                          </div>
                        ) : showAddCustomCategory ? (
                          <div className="flex items-center gap-3">
                            <button
                               type="button"
                               onClick={() => {
                                 setShowAddCustomCategory(false);
                                 setShowIconPicker(false);
                               }}
                               className="w-8 h-8 flex items-center justify-center text-ink hover:bg-surface-2 rounded-full transition-colors"
                            >
                              <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-lg font-heading font-bold text-ink">Kategori Baru</h3>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-heading font-bold text-ink">Pilih Kategori</h3>
                            <button
                              type="button"
                              onClick={() => setCategoryDrawerOpen(false)}
                              className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div 
                      className="flex-1 min-h-0 px-6 pb-8"
                      style={{ overflowY: 'auto' }}
                    >
                      {showIconPicker ? (
                        <div className="flex flex-col mt-2 h-full">
                          {/* Search bar */}
                          <div 
                            className="rounded-[16px] flex items-center px-4 py-3.5 mb-5 shrink-0 border"
                            style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }}
                          >
                            <input 
                              type="text" 
                              placeholder="Cari" 
                              className="bg-transparent border-none text-sm text-ink w-full focus:outline-none" 
                            />
                          </div>
                          {/* Categories Pills */}
                          <div className="flex gap-2 overflow-x-auto pb-4 shrink-0 no-scrollbar">
                            {Object.keys(EMOJI_DICTIONARY).map(cat => {
                              const icons = { Smiley: '😀', Hewan: '🐶', Makanan: '🍕', Aktivitas: '⚽' };
                              const isActive = emojiCategory === cat;
                              return (
                                <button 
                                  key={cat}
                                  onClick={() => setEmojiCategory(cat)}
                                  className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-opacity hover:opacity-80"
                                  style={{ 
                                    backgroundColor: isActive ? '#e6f7ff' : '#f1f5f9', 
                                    color: isActive ? '#1890ff' : '#64748b', 
                                    borderColor: isActive ? '#1890ff' : '#e2e8f0' 
                                  }}
                                >
                                  <span className="text-sm">{icons[cat]}</span> {cat}
                                </button>
                              );
                            })}
                          </div>
                          {/* Emoji Grid (Bulletproof Inline Styles) */}
                          <div 
                            className="mt-2 pb-12"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                              gap: '8px'
                            }}
                          >
                             {(EMOJI_DICTIONARY[emojiCategory] || EMOJI_DICTIONARY['Smiley']).map((emoji, idx) => (
                               <button 
                                 key={`${emoji}-${idx}`} 
                                 onClick={() => { setNewCustomCategoryIcon(emoji); setShowIconPicker(false); }} 
                                 className="flex items-center justify-center rounded-2xl transition-opacity hover:opacity-80 border border-slate-100"
                                 style={{ 
                                   backgroundColor: '#f1f5f9',
                                   fontSize: '22px',
                                   aspectRatio: '4/5'
                                 }}
                               >
                                 {emoji}
                               </button>
                             ))}
                          </div>
                        </div>
                      ) : !showAddCustomCategory ? (
                        <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-6">
                          {allCategories.map((cat) => (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => {
                                setCategory(cat.name);
                                setCategoryDrawerOpen(false);
                              }}
                              className="flex flex-col items-center gap-2 group focus:outline-none"
                            >
                              <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-transform group-hover:scale-105"
                                style={{ backgroundColor: `${cat.color}18` }}
                              >
                                {cat.icon}
                              </div>
                              <span className="text-xs font-medium text-ink-muted group-hover:text-ink transition-colors text-center w-full truncate px-1">
                                {cat.name}
                              </span>
                            </button>
                          ))}

                          {/* Add Custom Category button */}
                          <button
                            type="button"
                            onClick={() => setShowAddCustomCategory(true)}
                            className="flex flex-col items-center gap-2 group focus:outline-none"
                          >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-ink-muted border border-dashed transition-transform group-hover:scale-105" style={{ borderColor: '#e2e8f0' }}>
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-semibold text-accent-blue group-hover:text-accent-blue/80 transition-colors">
                              Tambah
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col mt-2">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setShowIconPicker(true)}
                              className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-3xl shrink-0 hover:bg-surface-1 transition-colors"
                              style={{ border: '1px solid #e2e8f0' }}
                            >
                              {newCustomCategoryIcon}
                            </button>
                            <input
                              type="text"
                              value={newCustomCategoryName}
                              onChange={(e) => setNewCustomCategoryName(e.target.value)}
                              placeholder="Nama kategori"
                              className="flex-1 bg-transparent rounded-xl px-4 py-4 text-base focus:outline-none text-ink transition-colors"
                              style={{ border: '1px solid #e2e8f0', borderColor: newCustomCategoryName ? '#1890ff' : '#e2e8f0' }}
                              autoFocus
                            />
                          </div>

                          <div className="flex gap-4 justify-center mt-12">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddCustomCategory(false);
                                setShowIconPicker(false);
                              }}
                              className="px-8 py-3 rounded-full text-sm font-semibold transition-colors text-ink bg-white"
                              style={{ border: '1px solid #e2e8f0' }}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCustomCategory}
                              disabled={!newCustomCategoryName.trim()}
                              className="px-8 py-3 rounded-full text-sm font-semibold transition-colors text-white disabled:opacity-50"
                              style={{ backgroundColor: '#1890ff', border: '1px solid #1890ff' }}
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet selection Drawer */}
            <AnimatePresence>
              {walletDrawerOpen && (
                <motion.div
                  className="absolute inset-0 z-50 flex items-end justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setWalletDrawerOpen(false)}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                  }}
                >
                  <motion.div
                    className="w-full rounded-t-[28px] flex flex-col"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    style={{ 
                      backgroundColor: '#ffffff',
                      borderTop: '1px solid #e2e8f0',
                      color: '#1e293b',
                      maxHeight: '85%',
                      height: 'auto',
                      borderRadius: isDesktop ? '28px' : '28px 28px 0 0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Fixed Header */}
                    <div className="p-6 pb-2 shrink-0">
                      {/* Pull Handle bar */}
                      <div className="flex justify-center mb-4">
                        <div className="w-10 h-1 rounded-full bg-slate-200" />
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-heading font-bold text-ink">Pilih Dompet</h3>
                        <button
                          type="button"
                          onClick={() => setWalletDrawerOpen(false)}
                          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-8">
                      {/* Wallets List */}
                      <div className="space-y-2.5">
                        {wallets.map((wallet) => (
                          <button
                            key={wallet._id}
                            type="button"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setWalletDrawerOpen(false);
                            }}
                            className={`w-full p-4 rounded-2xl border flex items-center gap-4 text-left transition-all ${
                              selectedWallet?._id === wallet._id
                                ? 'bg-surface-2 border-accent-blue/30'
                                : 'bg-surface-1 border-hairline-soft hover:bg-surface-2'
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                              style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                            >
                              👛
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink">{wallet.name}</p>
                              <p className="text-xs text-ink-muted mt-0.5">
                                Saldo: Rp {wallet.balance.toLocaleString('id-ID')}
                              </p>
                            </div>
                            {selectedWallet?._id === wallet._id && (
                              <div className="w-2 h-2 rounded-full bg-accent-blue" />
                            )}
                          </button>
                        ))}

                        {wallets.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-ink-muted text-sm">Tidak ada dompet ditemukan.</p>
                            <p className="text-xs text-ink-muted/50 mt-1">
                              Silakan tambahkan dompet terlebih dahulu di halaman Dompet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
