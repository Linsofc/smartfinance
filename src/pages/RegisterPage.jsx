import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok!');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-15%] left-[-20%] w-[500px] h-[500px] rounded-full bg-gradient-orange/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-20%] w-[400px] h-[400px] rounded-full bg-gradient-violet/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-gradient-orange to-gradient-coral flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gradient-orange/20"
          >
            <span className="text-2xl font-bold text-white">S</span>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-ink mb-2" style={{ letterSpacing: '-1.5px' }}>
            Buat Akun
          </h1>
          <p className="text-ink-muted text-sm">
            Mulai kelola keuangan Anda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              required
              className="w-full bg-surface-1 rounded-xl py-3.5 pl-12 pr-4 text-ink text-sm border border-hairline focus:border-accent-blue/50 transition-colors"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-surface-1 rounded-xl py-3.5 pl-12 pr-4 text-ink text-sm border border-hairline focus:border-accent-blue/50 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 karakter)"
              required
              className="w-full bg-surface-1 rounded-xl py-3.5 pl-12 pr-12 text-ink text-sm border border-hairline focus:border-accent-blue/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password"
              required
              className="w-full bg-surface-1 rounded-xl py-3.5 pl-12 pr-4 text-ink text-sm border border-hairline focus:border-accent-blue/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-danger text-xs font-medium bg-danger/10 rounded-lg px-4 py-2.5"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-full bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Daftar
              </>
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-sm text-ink-muted"
        >
          Sudah punya akun?{' '}
          <Link to="/login" className="text-accent-blue font-medium hover:underline">
            Masuk di sini
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
