import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Wallet as WalletIcon, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Pencil, 
  Trash2, 
  X, 
  ArrowLeftRight, 
  Receipt,
  ArrowRight,
  Calendar,
  AlertCircle,
  ImageIcon
} from 'lucide-react';
import { useDataCache } from '../context/DataCacheContext';
import WALLET_LOGOS, { WalletLogo, LogoBadge } from '../components/WalletLogos';

const WALLET_ICONS = {
  wallet: WalletIcon,
  card: CreditCard,
  phone: Smartphone,
  cash: Banknote,
};

const WALLET_PRESETS = [
  { name: 'Kas/Cash', icon: 'cash', color: '#22c55e', type: 'Tunai', logo: 'cash' },
  { name: 'BCA', icon: 'card', color: '#003D79', type: 'Tabungan', logo: 'bca' },
  { name: 'DANA', icon: 'phone', color: '#108ee9', type: 'E-Wallet', logo: 'dana' },
  { name: 'GoPay', icon: 'phone', color: '#00AED6', type: 'E-Wallet', logo: 'gopay' },
];

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function WalletPage() {
  const [wallets, setWallets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const cache = useDataCache();
  
  // Wallet CRUD Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    balance: '', 
    icon: 'wallet', 
    color: '#6a4cf5', 
    type: 'Tunai',
    logo: '' 
  });
  const logoFileRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Transfer Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Transfer History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchWallets = useCallback(async (opts) => {
    try {
      const data = await cache.fetchWallets(opts);
      setWallets(data.wallets);
      setTotalBalance(data.totalBalance);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const fetchTransfers = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await cache.fetchTransfers();
      setTransfers(data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWallets();
  }, [fetchWallets]);

  // Handle Wallet Save (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, balance: Number(formData.balance) || 0 };
      if (editingWallet) {
        await cache.updateWallet(editingWallet._id, payload);
      } else {
        await cache.createWallet(payload);
      }
      await fetchWallets({ force: true });
      closeModal();
    } catch (error) {
      console.error('Error saving wallet:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle Wallet Delete
  const handleDelete = async (id) => {
    if (!confirm('Hapus dompet ini? Semua data terkait saldo akan ikut terhapus.')) return;
    try {
      await cache.deleteWallet(id);
      await fetchWallets({ force: true });
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  // Handle Transfer execution
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError('');
    
    const { fromWalletId, toWalletId, amount, note, date } = transferData;
    if (!fromWalletId || !toWalletId || !amount || Number(amount) <= 0) {
      setTransferError('Mohon isi semua data transfer dengan benar.');
      return;
    }
    if (fromWalletId === toWalletId) {
      setTransferError('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }

    const sourceWallet = wallets.find(w => w._id === fromWalletId);
    if (sourceWallet && sourceWallet.balance < Number(amount)) {
      if (!confirm('Saldo dompet asal tidak mencukupi. Lanjutkan transfer?')) {
        return;
      }
    }

    setTransferring(true);
    try {
      await cache.createTransfer({
        fromWalletId,
        toWalletId,
        amount: Number(amount),
        note,
        date: new Date(date).toISOString()
      });
      await fetchWallets({ force: true });
      setShowTransferModal(false);
      setTransferData({
        fromWalletId: '',
        toWalletId: '',
        amount: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      setTransferError(error.response?.data?.message || 'Gagal melakukan transfer.');
    } finally {
      setTransferring(false);
    }
  };

  const openEditModal = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      balance: String(wallet.balance),
      icon: wallet.icon || 'wallet',
      color: wallet.color || '#6a4cf5',
      type: wallet.type || 'Tunai',
      logo: wallet.logo || ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingWallet(null);
    setFormData({ name: '', balance: '', icon: 'wallet', color: '#6a4cf5', type: 'Tunai', logo: '' });
  };

  // Group wallets by category
  const categories = ['Tunai', 'E-Wallet', 'Tabungan', 'Investasi', 'Kartu Kredit', 'Pinjaman', 'Lainnya'];
  const categorized = categories.reduce((acc, cat) => {
    acc[cat] = wallets.filter(w => w.type === cat || (!w.type && cat === 'Tunai'));
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
          <p className="text-ink-muted text-xs">Memuat dompet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight" style={{ letterSpacing: '-1px' }}>
            Dompet
          </h1>
          <p className="text-ink-muted text-xs mt-1">Kelola dompet dan saldo Anda</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Transfer History Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              fetchTransfers();
              setShowHistoryModal(true);
            }}
            className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-hairline transition-colors"
            title="Riwayat Transfer"
          >
            <Receipt size={18} />
          </motion.button>
          
          {/* Transfer Execution Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (wallets.length < 2) {
                alert('Anda membutuhkan minimal 2 dompet untuk melakukan transfer.');
                return;
              }
              setShowTransferModal(true);
            }}
            className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-hairline transition-colors"
            title="Transfer Antar Dompet"
          >
            <ArrowLeftRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-blue-dark to-brand-blue-light rounded-[24px] p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium mb-2">Total Saldo</p>
          <motion.p
            key={totalBalance}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-white tabular-nums tracking-tight"
            style={{ letterSpacing: '-1.5px' }}
          >
            {formatRupiah(totalBalance)}
          </motion.p>
          <p className="text-white/50 text-xs mt-2">{wallets.length} dompet aktif</p>
        </div>
      </motion.div>

      {/* Grouped Wallet List */}
      <div className="space-y-6">
        {wallets.length === 0 ? (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-8"
            >
              <div className="w-16 h-16 rounded-[20px] bg-surface-1 flex items-center justify-center mb-3 text-2xl">
                👛
              </div>
              <p className="text-ink-muted text-sm">Belum ada dompet</p>
              <p className="text-ink-muted/60 text-xs mt-1">Tambahkan dompet pertama Anda</p>
            </motion.div>

            <div>
              <h3 className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-3">Mulai Cepat</h3>
              <div className="grid grid-cols-2 gap-2">
                {WALLET_PRESETS.map((preset) => {
                  const IconComp = WALLET_ICONS[preset.icon] || WalletIcon;
                  return (
                    <motion.button
                      key={preset.name}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setFormData({ name: preset.name, balance: '0', icon: preset.icon, color: preset.color, type: preset.type, logo: preset.logo || '' });
                        setShowAddModal(true);
                      }}
                      className="bg-surface-1 rounded-xl p-4 border border-hairline-soft flex items-center gap-3 text-left hover:bg-surface-2 transition-colors"
                    >
                      {preset.logo ? (
                        <LogoBadge logoId={preset.logo} size={28} />
                      ) : (
                        <IconComp size={20} style={{ color: preset.color }} />
                      )}
                      <span className="text-sm font-medium text-ink">{preset.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          categories.map(cat => {
            const list = categorized[cat];
            if (list.length === 0) return null;
            const subtotal = list.reduce((sum, w) => sum + w.balance, 0);

            return (
              <div key={cat} className="space-y-2.5">
                {/* Category Header with Subtotal */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    {cat}
                  </span>
                  <span className="text-[11px] font-bold text-ink-muted tabular-nums">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                {/* Wallets under Category */}
                <div className="space-y-2">
                  {list.map((wallet) => {
                    const IconComp = WALLET_ICONS[wallet.icon] || WalletIcon;
                    return (
                      <motion.div
                        key={wallet._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft flex items-center gap-4 group hover:bg-surface-2/40 transition-colors"
                      >
                        <WalletLogo logo={wallet.logo} icon={wallet.icon} color={wallet.color} size={44} IconComp={IconComp} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{wallet.name}</p>
                          <p className="text-xs text-ink-muted mt-0.5">{wallet.type || 'Tunai'}</p>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-3">
                          <span className="text-sm font-bold text-ink tabular-nums">
                            {formatRupiah(wallet.balance)}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditModal(wallet)}
                              className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(wallet._id)}
                              className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-ink-muted hover:text-danger transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddModal(true)}
        className="fab-btn"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>

      {/* Add/Edit Wallet Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div className="modal-sheet p-6 pb-8 overflow-y-auto" style={{ maxHeight: '85dvh' }}
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-hairline rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-ink">{editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={closeModal}
                  className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-hairline transition-colors">
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ── Preview Card ── */}
                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Preview</label>
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: formData.color || '#6a4cf5' }}>
                    {formData.logo ? (
                      <WalletLogo logo={formData.logo} icon={formData.icon} color="#fff" size={40} IconComp={WALLET_ICONS[formData.icon] || WalletIcon} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        {(() => { const IC = WALLET_ICONS[formData.icon] || WalletIcon; return <IC size={20} className="text-white" />; })()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{formData.name || 'Nama Dompet'}</p>
                      <p className="text-[10px] text-white/60 font-medium mt-0.5">SALDO</p>
                      <p className="text-base font-bold text-white">{formatRupiah(Number(formData.balance) || 0)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Nama Dompet</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: BCA, DANA, CASH" required
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Tipe Kategori Dompet</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink appearance-none"
                    style={{ colorScheme: 'light' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Saldo (Rp)</label>
                  <input type="number" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0"
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink tabular-nums" />
                </div>

                {/* ── Logo Dompet (Opsional) ── */}
                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">
                    Logo Dompet <span className="text-ink-muted/50 normal-case font-medium">(Opsional)</span>
                  </label>

                  {/* Preset Logo Grid */}
                  <p className="text-[10px] font-semibold text-accent-blue mb-2">Pilih Logo</p>
                  <div className="grid grid-cols-7 gap-1.5 mb-3">
                    {WALLET_LOGOS.map((logo) => {
                      const isSelected = formData.logo === logo.id;
                      return (
                        <button
                          key={logo.id}
                          type="button"
                          title={logo.label}
                          onClick={() => setFormData({ ...formData, logo: logo.id })}
                          className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                            isSelected
                              ? 'border-accent-blue ring-1 ring-accent-blue/30 scale-105'
                              : 'border-transparent hover:border-hairline-soft'
                          }`}
                        >
                          <LogoBadge logoId={logo.id} size={36} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Upload */}
                  <p className="text-[10px] font-semibold text-ink-muted text-center mb-2 uppercase tracking-wider">atau unggah</p>
                  
                  {/* Show uploaded preview */}
                  {formData.logo && formData.logo.startsWith('data:image') && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center relative">
                        <img src={formData.logo} alt="Custom logo" className="w-9 h-9 object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger flex items-center justify-center"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        alert('Ukuran file maks 2MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setFormData({ ...formData, logo: ev.target.result });
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-hairline-soft hover:border-accent-blue/30 transition-colors flex flex-col items-center gap-1.5 group"
                  >
                    <ImageIcon size={20} className="text-ink-muted group-hover:text-accent-blue transition-colors" />
                    <span className="text-xs text-ink-muted group-hover:text-ink transition-colors">Klik untuk unggah gambar</span>
                    <span className="text-[10px] text-ink-muted/50">Format: JPG, PNG, GIF (maks. 2MB)</span>
                  </button>

                  {/* Clear logo button */}
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="mt-2 text-[11px] text-danger hover:text-danger/80 transition-colors font-medium"
                    >
                      ✕ Hapus logo
                    </button>
                  )}
                </div>

                {/* ── Fallback Icon (shown when no logo) ── */}
                {!formData.logo && (
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Pilih Icon Fallback</label>
                    <div className="flex gap-2">
                      {Object.keys(WALLET_ICONS).map((iconKey) => {
                        const IconItem = WALLET_ICONS[iconKey];
                        const isSelected = formData.icon === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: iconKey })}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                              isSelected 
                                ? 'bg-accent-blue/15 border-accent-blue text-accent-blue' 
                                : 'bg-surface-2 border-hairline text-ink-muted hover:text-white'
                            }`}
                          >
                            <IconItem size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Warna</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#22c55e', '#0099ff', '#6a4cf5', '#d44df0', '#ff7a3d', '#ff5577', '#f59e0b', '#108ee9', '#003D79', '#00529C', '#003876', '#00A450'].map((color) => (
                      <button key={color} type="button" onClick={() => setFormData({ ...formData, color })}
                        style={{ backgroundColor: color }}
                        className={`w-9 h-9 rounded-full transition-all ${
                          formData.color === color ? 'ring-2 ring-offset-2 ring-offset-canvas ring-white scale-110' : 'scale-100 hover:scale-105'
                        }`} />
                    ))}
                  </div>
                </div>

                <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-full text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                  {saving ? 'Menyimpan...' : editingWallet ? 'Simpan Perubahan' : 'Tambah Dompet'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Between Wallets Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowTransferModal(false)}
          >
            <motion.div className="modal-sheet p-6 pb-8"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-hairline rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-ink">Transfer Antar Dompet</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowTransferModal(false)}
                  className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-hairline transition-colors">
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-5">
                {transferError && (
                  <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-center gap-2 text-danger text-xs font-medium">
                    <AlertCircle size={14} />
                    <span>{transferError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Dari Dompet</label>
                  <select
                    value={transferData.fromWalletId}
                    onChange={(e) => setTransferData({ ...transferData, fromWalletId: e.target.value })}
                    required
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink"
                    style={{ colorScheme: 'light' }}
                  >
                    <option value="">Pilih Dompet Asal</option>
                    {wallets.map(w => (
                      <option key={w._id} value={w._id}>
                        {w.name} (Saldo: {formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Ke Dompet</label>
                  <select
                    value={transferData.toWalletId}
                    onChange={(e) => setTransferData({ ...transferData, toWalletId: e.target.value })}
                    required
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink"
                    style={{ colorScheme: 'light' }}
                  >
                    <option value="">Pilih Dompet Tujuan</option>
                    {wallets
                      .filter(w => w._id !== transferData.fromWalletId)
                      .map(w => (
                        <option key={w._id} value={w._id}>
                          {w.name} (Saldo: {formatRupiah(w.balance)})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Jumlah Transfer (Rp)</label>
                  <input
                    type="number"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    placeholder="0"
                    required
                    min="1"
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={transferData.date}
                    onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                    required
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Catatan</label>
                  <input
                    type="text"
                    value={transferData.note}
                    onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                    placeholder="Contoh: Kirim uang jajan, bayar utang"
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink"
                  />
                </div>

                <motion.button type="submit" disabled={transferring} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-full text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                  {transferring ? 'Memproses Transfer...' : 'Kirim Transfer'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div className="modal-sheet p-6 pb-8 flex flex-col"
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ height: '75dvh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center mb-4 shrink-0">
                <div className="w-10 h-1 bg-hairline rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-ink">Riwayat Transfer</h2>
                  <p className="text-xs text-ink-muted">Daftar transfer antar dompet</p>
                </div>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowHistoryModal(false)}
                  className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-hairline transition-colors">
                  <X size={18} />
                </motion.button>
              </div>

              {/* List Container */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-2">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="w-6 h-6 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
                    <span className="text-xs text-ink-muted">Memuat riwayat...</span>
                  </div>
                ) : transfers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted text-lg mb-2">
                      💸
                    </div>
                    <p className="text-xs text-ink-muted font-medium">Belum ada riwayat transfer</p>
                    <p className="text-[10px] text-ink-muted/50 mt-0.5">Semua transaksi transfer antar dompet akan muncul di sini</p>
                  </div>
                ) : (
                  transfers.map((item) => {
                    const fromWalletName = item.fromWalletId?.name || 'Dompet Terhapus';
                    const toWalletName = item.toWalletId?.name || 'Dompet Terhapus';
                    const fromColor = item.fromWalletId?.color || '#999999';
                    const toColor = item.toWalletId?.color || '#999999';
                    
                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-surface-2/40 border border-hairline-soft rounded-2xl p-4 flex flex-col gap-2.5"
                      >
                        {/* Top: Transfer flow */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="text-xs font-semibold px-2 py-0.5 rounded-md truncate max-w-[90px]"
                              style={{ backgroundColor: `${fromColor}15`, color: fromColor }}
                            >
                              {fromWalletName}
                            </span>
                            <ArrowRight size={12} className="text-ink-muted shrink-0" />
                            <span 
                              className="text-xs font-semibold px-2 py-0.5 rounded-md truncate max-w-[90px]"
                              style={{ backgroundColor: `${toColor}15`, color: toColor }}
                            >
                              {toWalletName}
                            </span>
                          </div>
                          
                          <span className="text-xs font-bold text-accent-blue tabular-nums">
                            {formatRupiah(item.amount)}
                          </span>
                        </div>

                        {/* Bottom: Date & Note */}
                        <div className="flex items-center justify-between text-[10px] text-ink-muted">
                          <div className="flex items-center gap-1">
                            <Calendar size={10} />
                            <span>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {item.note && (
                            <span className="italic truncate max-w-[150px]" title={item.note}>
                              "{item.note}"
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
