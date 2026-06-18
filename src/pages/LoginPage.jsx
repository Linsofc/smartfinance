import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'masukkan_client_id_google_anda_disini' && 
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'placeholder';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] right-[-20%] w-125 h-125 rounded-full bg-brand-blue-light/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-100 h-100 rounded-full bg-brand-green-light/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <motion.img
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            src="/circle.png"
            alt="SmartFinance Logo"
            className="w-20 h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-heading font-bold tracking-tight text-ink mb-2" style={{ letterSpacing: '-1px' }}>
            SmartFinance
          </h1>
          <p className="text-ink-muted text-sm">
            Masuk ke akun Anda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="login-email"
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
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
                <LogIn size={18} />
                Masuk
              </>
            )}
          </motion.button>
        </form>

        {/* Google Login */}
        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center w-full gap-4 mb-6">
            <div className="h-px bg-hairline-soft flex-1" />
            <span className="text-xs font-medium text-ink-muted">ATAU</span>
            <div className="h-px bg-hairline-soft flex-1" />
          </div>
          
          <div className="w-full flex justify-center">
            {isGoogleConfigured ? (
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setLoading(true);
                    await loginWithGoogle(credentialResponse.credential);
                    navigate('/', { replace: true });
                  } catch (err) {
                    setError(err.response?.data?.message || 'Login Google gagal.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setError('Login Google gagal.');
                }}
                theme="outline"
                size="large"
                text="continue_with"
                width="340"
              />
            ) : (
              <div className="w-full max-w-85 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-500">Google Login Nonaktif</p>
                  <p className="text-[10px] text-ink-muted mt-0.5 leading-relaxed">
                    Client ID Google belum dikonfigurasi di file <code>.env</code>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Register Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-sm text-ink-muted"
        >
          Belum punya akun?{' '}
          <Link to="/register" className="text-accent-blue font-medium hover:underline">
            Daftar sekarang
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
