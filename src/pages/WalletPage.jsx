import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet as WalletIcon, CreditCard, Smartphone, Banknote, Pencil, Trash2, X } from 'lucide-react';
import api from '../api/axios';

const WALLET_ICONS = {
  wallet: WalletIcon,
  card: CreditCard,
  phone: Smartphone,
  cash: Banknote,
};

const WALLET_PRESETS = [
  { name: 'Kas', icon: 'cash', color: '#22c55e' },
  { name: 'Bank', icon: 'card', color: '#0099ff' },
  { name: 'E-Wallet', icon: 'phone', color: '#6a4cf5' },
  { name: 'Tabungan', icon: 'wallet', color: '#ff7a3d' },
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [formData, setFormData] = useState({ name: '', balance: '', icon: 'wallet', color: '#6a4cf5' });
  const [saving, setSaving] = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await api.get('/wallets');
      setWallets(res.data.wallets);
      setTotalBalance(res.data.totalBalance);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingWallet) {
        await api.put(`/wallets/${editingWallet._id}`, {
          ...formData,
          balance: Number(formData.balance) || 0,
        });
      } else {
        await api.post('/wallets', {
          ...formData,
          balance: Number(formData.balance) || 0,
        });
      }
      await fetchWallets();
      closeModal();
    } catch (error) {
      console.error('Error saving wallet:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus dompet ini?')) return;
    try {
      await api.delete(`/wallets/${id}`);
      await fetchWallets();
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  const openEditModal = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      balance: String(wallet.balance),
      icon: wallet.icon,
      color: wallet.color,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingWallet(null);
    setFormData({ name: '', balance: '', icon: 'wallet', color: '#6a4cf5' });
  };

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-1px' }}>
          Dompet
        </h1>
        <p className="text-ink-muted text-xs mt-1">Kelola dompet dan saldo Anda</p>
      </div>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gradient-violet to-gradient-magenta rounded-[24px] p-6 relative overflow-hidden"
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

      {/* Wallet List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Dompet Saya</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="text-xs font-medium text-accent-blue flex items-center gap-1 hover:underline"
          >
            <Plus size={14} />
            Tambah
          </motion.button>
        </div>

        {wallets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-12"
          >
            <div className="w-16 h-16 rounded-[20px] bg-surface-1 flex items-center justify-center mb-3 text-2xl">
              👛
            </div>
            <p className="text-ink-muted text-sm">Belum ada dompet</p>
            <p className="text-ink-muted/60 text-xs mt-1">Tambahkan dompet pertama Anda</p>
          </motion.div>
        ) : (
          wallets.map((wallet, i) => {
            const IconComp = WALLET_ICONS[wallet.icon] || WalletIcon;
            return (
              <motion.div
                key={wallet._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface-1 rounded-[20px] p-4 border border-hairline-soft flex items-center gap-4 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${wallet.color}20` }}
                >
                  <IconComp size={22} style={{ color: wallet.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{wallet.name}</p>
                  <p className="text-lg font-bold tabular-nums tracking-tight mt-0.5" style={{ color: wallet.color }}>
                    {formatRupiah(wallet.balance)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(wallet)}
                    className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(wallet._id)}
                    className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-ink-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Quick Add Presets */}
      {wallets.length === 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Mulai Cepat</h3>
          <div className="grid grid-cols-2 gap-2">
            {WALLET_PRESETS.map((preset) => {
              const IconComp = WALLET_ICONS[preset.icon] || WalletIcon;
              return (
                <motion.button
                  key={preset.name}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setFormData({ name: preset.name, balance: '0', icon: preset.icon, color: preset.color });
                    setShowAddModal(true);
                  }}
                  className="bg-surface-1 rounded-xl p-4 border border-hairline-soft flex items-center gap-3 text-left hover:bg-surface-2 transition-colors"
                >
                  <IconComp size={20} style={{ color: preset.color }} />
                  <span className="text-sm font-medium text-ink">{preset.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
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
                <h2 className="text-lg font-bold tracking-tight text-ink">{editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={closeModal}
                  className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-hairline transition-colors">
                  <X size={18} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Nama</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama dompet" required
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Saldo Awal (Rp)</label>
                  <input type="number" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    placeholder="0"
                    className="w-full bg-surface-2 rounded-xl py-3 px-4 text-sm border border-hairline focus:border-accent-blue/50 transition-colors text-ink tabular-nums" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block mb-2">Warna</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#22c55e', '#0099ff', '#6a4cf5', '#d44df0', '#ff7a3d', '#ff5577', '#f59e0b'].map((color) => (
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
    </div>
  );
}
