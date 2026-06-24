import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Info, Shield, ChevronRight, Database, Trash2, Download, Upload, FileJson, Check, AlertTriangle, X, RefreshCcw, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useDataCache } from '../context/DataCacheContext';
import Swal from 'sweetalert2';
import packageJson from '../../package.json';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { clearAllCache } = useDataCache();
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [importProgress, setImportProgress] = useState(null); // null | 'loading' | 'success' | 'error'
  const [importResult, setImportResult] = useState('');
  const [aboutModal, setAboutModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar Akun?',
      text: 'Yakin ingin keluar dari sesi ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      background: 'var(--color-surface-1)',
      color: 'var(--color-ink)',
      customClass: {
        popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
        title: 'text-lg font-bold text-ink',
        htmlContainer: 'text-sm text-ink-muted mt-2',
        confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white transition-all active:scale-[0.98]',
        cancelButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-2 border border-hairline text-ink transition-all active:scale-[0.98]'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/login', { replace: true });
      }
    });
  };

  const handleImportCSV = async () => {
    Swal.fire({
      title: 'Impor Data Contoh?',
      text: 'Impor data transaksi contoh dari file CSV? Ini akan menambahkan transaksi bawaan untuk akun Anda.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Ya, Impor',
      cancelButtonText: 'Batal',
      background: 'var(--color-surface-1)',
      color: 'var(--color-ink)',
      customClass: {
        popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
        title: 'text-lg font-bold text-ink',
        htmlContainer: 'text-sm text-ink-muted mt-2',
        confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white transition-all active:scale-[0.98]',
        cancelButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-2 border border-hairline text-ink transition-all active:scale-[0.98]'
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        setImporting(true);
        try {
          const res = await api.post('/transactions/import-csv');
          Swal.fire({
            title: 'Berhasil!',
            text: res.data.message,
            icon: 'success',
            background: 'var(--color-surface-1)',
            color: 'var(--color-ink)',
            customClass: {
              popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
              title: 'text-lg font-bold text-ink',
              confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white'
            },
            buttonsStyling: false
          });
          clearAllCache();
          navigate('/'); // Go back to dashboard to see imported data
        } catch (err) {
          Swal.fire({
            title: 'Gagal!',
            text: err.response?.data?.message || 'Gagal mengimpor data CSV.',
            icon: 'error',
            background: 'var(--color-surface-1)',
            color: 'var(--color-ink)',
            customClass: {
              popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
              title: 'text-lg font-bold text-ink',
              confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white'
            },
            buttonsStyling: false
          });
        } finally {
          setImporting(false);
        }
      }
    });
  };

  const handleResetData = async () => {
    Swal.fire({
      title: 'Hapus Semua Data?',
      text: 'PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini akan menghapus semua transaksi, dompet, riwayat transfer, dan anggaran Anda secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      background: 'var(--color-surface-1)',
      color: 'var(--color-ink)',
      customClass: {
        popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
        title: 'text-lg font-bold text-danger',
        htmlContainer: 'text-sm text-ink-muted mt-2',
        confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white transition-all active:scale-[0.98]',
        cancelButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-2 border border-hairline text-ink transition-all active:scale-[0.98]'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Konfirmasi Terakhir',
          text: 'TINDAKAN INI TIDAK DAPAT DIBATALKAN. Semua data Anda akan dihapus secara permanen.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Hapus Permanen',
          cancelButtonText: 'Batal',
          background: 'var(--color-surface-1)',
          color: 'var(--color-ink)',
          customClass: {
            popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
            title: 'text-lg font-bold text-danger',
            htmlContainer: 'text-sm text-ink-muted mt-2',
            confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white transition-all active:scale-[0.98]',
            cancelButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-2 border border-hairline text-ink transition-all active:scale-[0.98]'
          },
          buttonsStyling: false
        }).then(async (result2) => {
          if (result2.isConfirmed) {
            setResetting(true);
            try {
              const res = await api.post('/auth/reset');
              Swal.fire({
                title: 'Data Direset!',
                text: res.data.message,
                icon: 'success',
                background: 'var(--color-surface-1)',
                color: 'var(--color-ink)',
                customClass: {
                  popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
                  title: 'text-lg font-bold text-ink',
                  confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white'
                },
                buttonsStyling: false
              });
              clearAllCache();
              navigate('/'); // Go back to dashboard
            } catch (err) {
              Swal.fire({
                title: 'Gagal!',
                text: err.response?.data?.message || 'Gagal menghapus data.',
                icon: 'error',
                background: 'var(--color-surface-1)',
                color: 'var(--color-ink)',
                customClass: {
                  popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
                  title: 'text-lg font-bold text-ink',
                  confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white'
                },
                buttonsStyling: false
              });
            } finally {
              setResetting(false);
            }
          }
        });
      }
    });
  };

  const openDeleteModal = () => {
    setDeleteModal(true);
    setConfirmDeleteText('');
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'HAPUS AKUN') {
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await api.delete('/auth/account');
      await Swal.fire({
        title: 'Akun Dihapus!',
        text: res.data.message,
        icon: 'success',
        background: 'var(--color-surface-1)',
        color: 'var(--color-ink)',
        customClass: {
          popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
          title: 'text-lg font-bold text-ink',
          confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white'
        },
        buttonsStyling: false
      });
      clearAllCache();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      Swal.fire({
        title: 'Gagal!',
        text: err.response?.data?.message || 'Gagal menghapus akun.',
        icon: 'error',
        background: 'var(--color-surface-1)',
        color: 'var(--color-ink)',
        customClass: {
          popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
          title: 'text-lg font-bold text-ink',
          confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white'
        },
        buttonsStyling: false
      });
    } finally {
      setDeletingAccount(false);
      setDeleteModal(false);
    }
  };

  // ─── Export handler ──────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/data/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `smartfinance_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        title: 'Ekspor Gagal!',
        text: err.response?.data?.message || 'Gagal mengekspor data.',
        icon: 'error',
        background: 'var(--color-surface-1)',
        color: 'var(--color-ink)',
        customClass: {
          popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
          title: 'text-lg font-bold text-ink',
          confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white'
        },
        buttonsStyling: false
      });
    } finally {
      setExporting(false);
    }
  };

  // ─── CSV Export handler ─────────────────────────────
  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await api.get('/data/export-csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `smartfinance_transactions_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        title: 'Ekspor CSV Gagal!',
        text: err.response?.data?.message || 'Gagal mengekspor data CSV.',
        icon: 'error',
        background: 'var(--color-surface-1)',
        color: 'var(--color-ink)',
        customClass: {
          popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
          title: 'text-lg font-bold text-ink',
          confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white'
        },
        buttonsStyling: false
      });
    } finally {
      setExportingCSV(false);
    }
  };

  // ─── Import handlers ────────────────────────────────
  const openImportModal = () => {
    setImportModal(true);
    setImportPreview(null);
    setImportFile(null);
    setClearExisting(false);
    setImportProgress(null);
    setImportResult('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      Swal.fire({
        title: 'Format Salah!',
        text: 'Hanya file JSON yang didukung.',
        icon: 'warning',
        background: 'var(--color-surface-1)',
        color: 'var(--color-ink)',
        customClass: {
          popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
          title: 'text-lg font-bold text-ink',
          confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white'
        },
        buttonsStyling: false
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'File Terlalu Besar!',
        text: 'Ukuran file maksimal 5MB. Pilih file yang lebih kecil.',
        icon: 'warning',
        background: 'var(--color-surface-1)',
        color: 'var(--color-ink)',
        customClass: {
          popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
          title: 'text-lg font-bold text-ink',
          confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white'
        },
        buttonsStyling: false
      });
      return;
    }

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setImportPreview(parsed);
      } catch {
        Swal.fire({
          title: 'File Rusak!',
          text: 'File JSON tidak valid.',
          icon: 'error',
          background: 'var(--color-surface-1)',
          color: 'var(--color-ink)',
          customClass: {
            popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
            title: 'text-lg font-bold text-ink',
            confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white'
          },
          buttonsStyling: false
        });
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (!importPreview?.data) return;

    setImportProgress('loading');
    try {
      const res = await api.post('/data/import', {
        data: importPreview.data,
        clearExisting,
      });
      setImportProgress('success');
      setImportResult(res.data.message);
      clearAllCache();
    } catch (err) {
      setImportProgress('error');
      setImportResult(err.response?.data?.message || 'Gagal mengimpor data.');
    }
  };

  const closeImportModal = () => {
    setImportModal(false);
    if (importProgress === 'success') {
      navigate('/');
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
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gradient-violet to-gradient-magenta flex items-center justify-center shrink-0 overflow-hidden shadow-sm border-2 border-surface-1">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
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
            onClick={() => navigate('/settings/profile')}
          />
          <div className="h-px bg-hairline-soft mx-4" />
          <MenuItem
            icon={<Shield size={18} />}
            label="Keamanan"
            sublabel="Password & autentikasi"
            onClick={() => navigate('/settings/security')}
          />
          {user?.isPremium && (
            <>
              <div className="h-px bg-hairline-soft mx-4" />
              <MenuItem
                icon={<Cpu size={18} />}
                label="API & Automation"
                sublabel="API keys & AI Agent"
                onClick={() => navigate('/settings/api')}
              />
            </>
          )}
        </motion.div>

        {/* ─── Export & Import Data Section ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-surface-1 rounded-[20px] border border-hairline-soft overflow-hidden"
        >
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full p-4 flex items-center gap-3 hover:bg-surface-2/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))' }}>
              <Download size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Ekspor Data</p>
              <p className="text-xs text-ink-muted truncate mt-0.5">
                {exporting ? 'Mengunduh...' : 'Unduh semua data sebagai file JSON'}
              </p>
            </div>
            {exporting ? (
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
            )}
          </button>

          <div className="h-px bg-hairline-soft mx-4" />

          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="w-full p-4 flex items-center gap-3 hover:bg-surface-2/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15))' }}>
              <Download size={18} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Ekspor CSV</p>
              <p className="text-xs text-ink-muted truncate mt-0.5">
                {exportingCSV ? 'Mengunduh...' : 'Unduh transaksi sebagai file CSV'}
              </p>
            </div>
            {exportingCSV ? (
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
            )}
          </button>

          <div className="h-px bg-hairline-soft mx-4" />

          <button
            onClick={openImportModal}
            className="w-full p-4 flex items-center gap-3 hover:bg-surface-2/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
              <Upload size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Impor Data</p>
              <p className="text-xs text-ink-muted truncate mt-0.5">Pulihkan data dari file backup JSON</p>
            </div>
            <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface-1 rounded-[20px] border border-hairline-soft overflow-hidden"
        >
          <button
            onClick={handleResetData}
            disabled={resetting}
            className="w-full p-4 flex items-center gap-3 hover:bg-danger/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center text-danger shrink-0">
              <RefreshCcw size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-danger">Reset Semua Data</p>
              <p className="text-xs text-ink-muted truncate mt-0.5">
                {resetting ? 'Sedang mengosongkan...' : 'Kosongkan transaksi, dompet, & anggaran'}
              </p>
            </div>
            <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
          </button>

          <div className="h-px bg-hairline-soft mx-4" />

          <button
            onClick={openDeleteModal}
            className="w-full p-4 flex items-center gap-3 hover:bg-danger/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center text-danger shrink-0">
              <Trash2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-danger">Hapus Akun Permanen</p>
              <p className="text-xs text-ink-muted truncate mt-0.5">
                Hapus akun Anda beserta seluruh data secara permanen
              </p>
            </div>
            <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
          </button>
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
            sublabel={`SmartFinance v${packageJson.version}`}
            onClick={() => setAboutModal(true)}
          />
          <div className="h-px bg-hairline-soft mx-4" />
          <button
            onClick={handleLogout}
            className="w-full p-4 flex items-center gap-3 hover:bg-danger/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-danger/15 flex items-center justify-center shrink-0">
              <LogOut size={18} className="text-danger" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-danger">Keluar</span>
              <p className="text-xs text-ink-muted truncate mt-0.5">Keluar dari sesi akun saat ini</p>
            </div>
            <ChevronRight size={16} className="text-ink-muted/50 shrink-0" />
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-6 pb-4"
      >
        <p className="text-ink-muted/30 text-[10px] mt-1">Linsofc | Smart Finance | © 2026</p>
      </motion.div>

      {/* ═══════════ Import Modal ═══════════ */}
      <AnimatePresence>
        {importModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-[28px] border border-hairline bg-surface-1 shadow-[0_24px_50px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileJson size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-ink">Impor Data</h2>
                    <p className="text-[11px] text-ink-muted mt-0.5">Pulihkan dari file backup</p>
                  </div>
                </div>
                <button onClick={closeImportModal} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-hairline transition-colors">
                  <X size={16} className="text-ink-muted" />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4">
                {/* Import Progress States */}
                {importProgress === 'loading' && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-ink-muted">Sedang mengimpor data...</p>
                  </div>
                )}

                {importProgress === 'success' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center py-6 gap-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center text-success">
                      <Check size={28} />
                    </div>
                    <p className="text-sm font-medium text-ink text-center">Impor Berhasil!</p>
                    <p className="text-xs text-ink-muted text-center px-4">{importResult}</p>
                    <button
                      onClick={closeImportModal}
                      className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-primary hover:bg-primary/90 shadow-md shadow-primary/10"
                    >
                      Kembali ke Dashboard
                    </button>
                  </motion.div>
                )}

                {importProgress === 'error' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center py-6 gap-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-danger/15 flex items-center justify-center">
                      <AlertTriangle size={28} className="text-danger" />
                    </div>
                    <p className="text-sm font-medium text-danger text-center">Impor Gagal</p>
                    <p className="text-xs text-ink-muted text-center px-4">{importResult}</p>
                    <button
                      onClick={() => { setImportProgress(null); setImportFile(null); setImportPreview(null); }}
                      className="mt-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-surface-2 border border-hairline text-ink hover:bg-hairline transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </motion.div>
                )}

                {/* File Selection & Preview */}
                {!importProgress && (
                  <>
                    {/* Dropzone */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {!importPreview ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 rounded-2xl border-2 border-dashed border-hairline hover:border-primary/50 transition-colors flex flex-col items-center gap-3 bg-surface-2/50 group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-surface-1 flex items-center justify-center group-hover:bg-primary/5 transition-colors border border-hairline-soft">
                          <Upload size={22} className="text-ink-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-ink">Pilih file backup</p>
                          <p className="text-[11px] text-ink-muted mt-0.5">Format: .json (dari ekspor SmartFinance)</p>
                        </div>
                      </button>
                    ) : (
                      <>
                        {/* File info */}
                        <div className="bg-surface-2 border border-hairline-soft rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <FileJson size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-ink truncate">{importFile?.name}</p>
                              <p className="text-[11px] text-ink-muted">
                                {importPreview.exportedAt
                                  ? `Diekspor: ${new Date(importPreview.exportedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                  : 'File backup SmartFinance'}
                              </p>
                            </div>
                            <button
                              onClick={() => { setImportFile(null); setImportPreview(null); }}
                              className="w-7 h-7 rounded-full bg-surface-1 border border-hairline-soft flex items-center justify-center hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition-colors"
                            >
                              <X size={14} className="text-ink-muted" />
                            </button>
                          </div>

                          {/* Data summary */}
                          {importPreview.summary && (
                            <div className="grid grid-cols-2 gap-2">
                              <SummaryBadge label="Dompet" count={importPreview.summary.totalWallets} color="#1890ff" />
                              <SummaryBadge label="Transaksi" count={importPreview.summary.totalTransactions} color="#1e9045" />
                              <SummaryBadge label="Anggaran" count={importPreview.summary.totalBudgets} color="#f59e0b" />
                              <SummaryBadge label="Transfer" count={importPreview.summary.totalTransfers} color="#06b6d4" />
                            </div>
                          )}
                        </div>

                        {/* Clear existing toggle */}
                        <button
                          onClick={() => setClearExisting(!clearExisting)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors border border-transparent hover:border-hairline"
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${clearExisting ? 'bg-primary border-primary text-white' : 'border-hairline bg-surface-1'}`}>
                            {clearExisting && <Check size={12} />}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm text-ink font-medium">Hapus data lama sebelum impor</p>
                            <p className="text-[11px] text-ink-muted mt-0.5">Data saat ini akan sepenuhnya diganti dengan data impor</p>
                          </div>
                        </button>

                        {clearExisting && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="rounded-xl p-3 flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger"
                          >
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <p className="text-[11px] leading-relaxed">
                              Semua data yang ada (transaksi, dompet, anggaran, transfer) akan dihapus dan diganti data dari file backup.
                            </p>
                          </motion.div>
                        )}

                        {/* Import button */}
                        <button
                          onClick={handleImportConfirm}
                          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/10"
                        >
                          Mulai Impor Data
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ Delete Account Modal ═══════════ */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-[28px] border border-hairline bg-surface-1 shadow-[0_24px_50px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-danger/10 flex items-center justify-center text-danger shrink-0">
                    <AlertTriangle size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-danger">Hapus Akun Permanen</h2>
                    <p className="text-[11px] text-ink-muted mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>
                <button onClick={() => setDeleteModal(false)} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-hairline transition-colors">
                  <X size={16} className="text-ink-muted" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-5 pb-5 space-y-4">
                <div className="rounded-xl p-3 bg-danger/10 border border-danger/20 text-danger">
                  <p className="text-xs leading-relaxed">
                    Menghapus akun akan menghapus profil Anda beserta <strong>seluruh data transaksi, dompet, transfer, dan anggaran</strong> secara permanen. Anda tidak akan bisa memulihkan data ini atau login kembali.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-ink-muted">
                    Ketik kata <strong className="text-danger font-semibold">HAPUS AKUN</strong> di bawah untuk mengonfirmasi:
                  </p>
                  <input
                    type="text"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder="HAPUS AKUN"
                    className="w-full px-4 py-3 rounded-xl border border-hairline bg-surface-2 text-ink text-sm font-medium focus:outline-none focus:border-danger transition-colors placeholder:text-ink-muted/30"
                  />
                </div>

                {/* Confirm / Cancel Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDeleteModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-2 border border-hairline text-ink hover:bg-hairline transition-colors active:scale-[0.98]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || confirmDeleteText !== 'HAPUS AKUN'}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${confirmDeleteText === 'HAPUS AKUN' ? 'bg-danger hover:bg-danger/90 cursor-pointer shadow-md shadow-danger/10' : 'bg-surface-2 text-ink-muted/40 border border-hairline-soft cursor-not-allowed'}`}
                  >
                    {deletingAccount ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Hapus Akun'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ About Application Modal ═══════════ */}
      <AnimatePresence>
        {aboutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setAboutModal(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-[28px] border border-hairline bg-surface-1 shadow-[0_24px_50px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-ink">Tentang Aplikasi</h2>
                    <p className="text-[11px] text-ink-muted mt-0.5">Informasi SmartFinance</p>
                  </div>
                </div>
                <button onClick={() => setAboutModal(false)} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center hover:bg-hairline transition-colors">
                  <X size={16} className="text-ink-muted" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-5 pb-5 space-y-4">
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="w-16 h-16 rounded-[24px] bg-white border border-hairline-soft flex items-center justify-center shadow-md p-2.5 mb-3 overflow-hidden">
                    <img src="/logo.png" alt="SmartFinance Logo" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-ink">SmartFinance</h3>
                  <p className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mt-1.5">v{packageJson.version} Pro</p>
                  
                  <p className="text-xs text-ink-muted leading-relaxed mt-4 px-2">
                    SmartFinance adalah platform manajemen keuangan pribadi modern yang dirancang untuk membantu Anda memantau pengeluaran, mengelola anggaran, serta memaksimalkan otomatisasi pencatatan keuangan secara cerdas.
                  </p>
                </div>

                <div className="bg-surface-2 border border-hairline-soft rounded-2xl p-4 space-y-2.5 text-xs text-ink">
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Developer</span>
                    <span className="font-semibold text-ink">Linsofc</span>
                  </div>
                  <div className="h-px bg-hairline-soft" />
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Version</span>
                    <span className="font-semibold text-ink">{packageJson.version}</span>
                  </div>
                  <div className="h-px bg-hairline-soft" />
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Lisensi</span>
                    <span className="font-semibold text-ink">Hak Cipta Terpelihara © 2026</span>
                  </div>
                </div>

                <button
                  onClick={() => setAboutModal(false)}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all bg-primary hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/10"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

function SummaryBadge({ label, count, color }) {
  return (
    <div className="flex items-center gap-2 bg-surface-2 border border-hairline-soft rounded-xl px-3 py-2">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[11px] text-ink-muted flex-1">{label}</span>
      <span className="text-xs font-semibold text-ink">{count}</span>
    </div>
  );
}
