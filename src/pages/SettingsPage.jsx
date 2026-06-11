import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Info, Shield, ChevronRight, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);

  const handleLogout = () => {
    if (confirm('Yakin ingin keluar?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleImportCSV = async () => {
    if (confirm('Impor data transaksi contoh dari file CSV? Ini akan menambahkan transaksi bawaan untuk akun Anda.')) {
      setImporting(true);
      try {
        const res = await api.post('/transactions/import-csv');
        alert(res.data.message);
        navigate('/'); // Go back to dashboard to see imported data
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal mengimpor data CSV.');
      } finally {
        setImporting(false);
      }
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-1px' }}>
          Pengaturan
        </h1>
        <p className="text-ink-muted text-xs mt-1">Kelola profil dan preferensi Anda</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-1 rounded-[20px] p-5 border border-hairline-soft flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gradient-violet to-gradient-magenta flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-ink truncate">{user?.name || 'User'}</p>
          <p className="text-xs text-ink-muted truncate">{user?.email || 'user@email.com'}</p>
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-1 rounded-[20px] border border-hairline-soft overflow-hidden"
        >
          <MenuItem
            icon={<User size={18} />}
            label="Profil Saya"
            sublabel={user?.name || 'User'}
          />
          <div className="h-px bg-hairline-soft mx-4" />
          <MenuItem
            icon={<Shield size={18} />}
            label="Keamanan"
            sublabel="Password & autentikasi"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface-1 rounded-[20px] border border-hairline-soft overflow-hidden"
        >
          <MenuItem
            icon={<Database size={18} />}
            label="Impor Contoh Transaksi"
            sublabel={importing ? "Mengimpor data..." : "Impor dari bajet_cashflow.csv"}
            onClick={handleImportCSV}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-1 rounded-[20px] border border-hairline-soft overflow-hidden"
        >
          <MenuItem
            icon={<Info size={18} />}
            label="Tentang Aplikasi"
            sublabel="SmartFinance v1.0.0"
          />
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="w-full bg-surface-1 rounded-[20px] border border-hairline-soft p-4 flex items-center gap-3 hover:bg-surface-2 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center">
              <LogOut size={18} className="text-danger" />
            </div>
            <span className="text-sm font-medium text-danger flex-1 text-left">Keluar</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-6 pb-4"
      >
        <p className="text-ink-muted/40 text-xs">SmartFinance v1.0.0</p>
        <p className="text-ink-muted/30 text-[10px] mt-1">UAS Project — PSBF 2026</p>
      </motion.div>
    </div>
  );
}

function MenuItem({ icon, label, sublabel, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-center gap-3 hover:bg-surface-2/50 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-ink-muted shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {sublabel && <p className="text-xs text-ink-muted truncate mt-0.5">{sublabel}</p>}
      </div>
      <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
    </button>
  );
}
