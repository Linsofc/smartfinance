import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, Save, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SecurityPage() {
  const navigate = useNavigate();
  const { updateSecurity } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Semua field harus diisi.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await updateSecurity({ oldPassword, newPassword });
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Navigate away after a short delay for better UX
      setTimeout(() => {
        navigate('/settings');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas pb-20 sm:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface-1/80 backdrop-blur-md border-b border-hairline-soft px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-surface-2/80 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-ink">Keamanan</h1>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto mt-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-start gap-3 bg-danger/10 border border-danger/20"
          >
            <AlertTriangle size={18} className="text-danger mt-0.5 shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-emerald-600 font-medium">Password berhasil diperbarui! Mengalihkan...</p>
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Form Fields */}
          <div className="bg-surface-1 rounded-[24px] border border-hairline-soft p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
                Password Lama
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-ink-muted/50" />
                </div>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-transparent focus:bg-surface-1 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10 rounded-xl text-sm font-medium text-ink transition-all outline-none"
                  placeholder="Masukkan password lama"
                />
              </div>
            </div>

            <div className="h-px bg-hairline-soft my-4" />

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-ink-muted/50" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-transparent focus:bg-surface-1 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10 rounded-xl text-sm font-medium text-ink transition-all outline-none"
                  placeholder="Masukkan password baru"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-ink-muted/50" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-transparent focus:bg-surface-1 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10 rounded-xl text-sm font-medium text-ink transition-all outline-none"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent-blue hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Perbarui Password
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
