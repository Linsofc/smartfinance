import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronLeft, User, Mail, Save, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar (JPG/PNG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // Max 2MB
      setError('Ukuran gambar maksimal 2MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicture(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email) {
      setError('Nama dan Email harus diisi.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ name, email, profilePicture });
      alert('Profil berhasil diperbarui!');
      navigate('/settings');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui profil.');
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
        <h1 className="text-xl font-bold tracking-tight text-ink">Profil Saya</h1>
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 bg-surface-1 p-6 rounded-[24px] border border-hairline-soft">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-1 bg-gradient-to-br from-gradient-violet to-gradient-magenta flex items-center justify-center shadow-sm">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent-blue text-white flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors"
              >
                <Camera size={14} />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink">Foto Profil</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Format JPG/PNG, maks 2MB.</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-surface-1 rounded-[24px] border border-hairline-soft p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-ink-muted/50" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-transparent focus:bg-surface-1 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10 rounded-xl text-sm font-medium text-ink transition-all outline-none"
                  placeholder="Nama Lengkap"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-ink-muted/50" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-transparent focus:bg-surface-1 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10 rounded-xl text-sm font-medium text-ink transition-all outline-none"
                  placeholder="Alamat Email"
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
                Simpan Perubahan
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
