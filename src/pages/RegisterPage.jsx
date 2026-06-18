import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const { register, verifyRegister, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'masukkan_client_id_google_anda_disini' && 
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'placeholder';

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split('');
      setOtp(newOtp);
      inputRefs.current[5].focus();
    }
  };

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
      setStep('otp');
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Kode OTP harus 6 digit.');
      return;
    }

    setLoading(true);
    try {
      await verifyRegister(email, otpCode);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verifikasi OTP gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-15%] left-[-20%] w-[500px] h-[500px] rounded-full bg-brand-blue-light/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-20%] w-[400px] h-[400px] rounded-full bg-brand-green-light/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {step === 'form' ? (
          <>
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                src="/circle.png"
                alt="SmartFinance Logo"
                className="w-20 h-20 object-contain mx-auto mb-4"
              />
              <h1 className="text-3xl font-heading font-bold tracking-tight text-ink mb-2" style={{ letterSpacing: '-1px' }}>
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
                        setError(err.response?.data?.message || 'Registrasi Google gagal.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onError={() => {
                      setError('Registrasi Google gagal.');
                    }}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    width="340"
                  />
                ) : (
                  <div className="w-full max-w-[340px] p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-amber-500">Google Register Nonaktif</p>
                      <p className="text-[10px] text-ink-muted mt-0.5 leading-relaxed">
                        Client ID Google belum dikonfigurasi di file <code>.env</code>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
          </>
        ) : (
          <>
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-blue-light/10 border border-brand-blue-light/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="text-accent-blue" size={28} />
              </div>
              <h1 className="text-2xl font-heading font-bold tracking-tight text-ink mb-2">
                Verifikasi Email
              </h1>
              <p className="text-ink-muted text-xs leading-relaxed max-w-[280px] mx-auto">
                Kami telah mengirimkan kode OTP 6-digit ke <strong className="text-ink">{email}</strong>.
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6-Digit input container */}
              <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 bg-surface-1 rounded-xl text-center font-bold text-xl text-ink border border-hairline focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all focus:outline-none"
                  />
                ))}
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

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-full bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  'Verifikasi & Daftar'
                )}
              </motion.button>
            </form>

            {/* Resend and back navigation */}
            <div className="mt-8 text-center space-y-4">
              <div className="text-xs text-ink-muted">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-accent-blue font-semibold hover:underline disabled:opacity-50"
                  >
                    Kirim Ulang Kode OTP
                  </button>
                ) : (
                  <span>
                    Kirim ulang OTP dalam{' '}
                    <strong className="text-ink">
                      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </strong>
                  </span>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  Kembali ke formulir
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
