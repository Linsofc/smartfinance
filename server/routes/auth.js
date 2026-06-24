import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import Transfer from '../models/Transfer.js';
import Budget from '../models/Budget.js';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import Otp from '../models/Otp.js';
import PasswordReset from '../models/PasswordReset.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramNotification } from '../utils/telegram.js';
import { getCache, setCache, invalidateCache } from '../utils/cache.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: (req) => {
    const owners = process.env.AKUN_PREM?.split(',').map(e => e.trim().toLowerCase()) || [];
    return owners.includes(req.body?.email?.toLowerCase());
  },
  message: { message: 'Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.' }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

router.use(authLimiter);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Send OTP Email helper
const sendOtpEmail = async (email, otp) => {
  const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"SmartFinance" <saifulrijal@linsofc.my.id>`,
        to: email,
        subject: 'Kode Verifikasi OTP Registrasi SmartFinance',
        html: `
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
  
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; border: 1px solid #e2e8f0;">

    <div style="text-align: center; padding: 32px 24px 24px; border-bottom: 1px solid #f1f5f9;">
      <img src="cid:logo" alt="SmartFinance Logo" style="height: 48px; width: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
      <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">Verifikasi Keamanan</h2>
    </div>

    <div style="padding: 32px 24px;">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">Halo,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Terima kasih telah memilih <strong>SmartFinance</strong>. Untuk melanjutkan proses pendaftaran, silakan masukkan kode verifikasi berikut:</p>

      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; padding: 16px 32px; background-color: #eff6ff; border-radius: 8px; border: 1px dashed #93c5fd;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace;">${otp}</span>
        </div>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 4px 4px 0; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;">
          <strong>Penting:</strong> Kode OTP ini bersifat rahasia dan hanya berlaku selama <strong>1 menit</strong>. Jangan pernah membagikan kode ini kepada siapa pun, termasuk pihak kami.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 0;">Jika Anda tidak merasa melakukan pendaftaran ini, Anda dapat mengabaikan email ini dengan aman.</p>
    </div>

    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">Linsofc | Smart Finance | © 2026</p>
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.</p>
    </div>

  </div>
</div>
        `,
        attachments: [{
          filename: 'logo.png',
          path: path.join(__dirname, '../../public/logo.png'),
          cid: 'logo'
        }]
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email OTP berhasil dikirim ke ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Gagal mengirim email OTP via SMTP:', error);
    }
  }

  // // Fallback to console logging in development
  // console.log('\n========================================');
  // console.log(`📬 [OTP REGISTER]`);
  // console.log(`Tujuan: ${email}`);
  // console.log(`Kode OTP: ${otp}`);
  // console.log('========================================\n');
  return false;
};

// Send Forgot Password OTP Email helper
const sendForgotPasswordEmail = async (email, otp) => {
  const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"SmartFinance" <saifulrijal@linsofc.my.id>`,
        to: email,
        subject: 'Kode OTP Lupa Password SmartFinance',
        html: `
<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
  
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; border: 1px solid #e2e8f0;">

    <div style="text-align: center; padding: 32px 24px 24px; border-bottom: 1px solid #f1f5f9;">
      <img src="cid:logo" alt="SmartFinance Logo" style="height: 48px; width: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
      <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 600;">Reset Password</h2>
    </div>

    <div style="padding: 32px 24px;">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">Halo,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Kami menerima permintaan untuk mereset password akun <strong>SmartFinance</strong> Anda. Silakan gunakan kode OTP berikut untuk melanjutkan proses reset password:</p>

      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; padding: 16px 32px; background-color: #eff6ff; border-radius: 8px; border: 1px dashed #93c5fd;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace;">${otp}</span>
        </div>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 4px 4px 0; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #991b1b; margin: 0; line-height: 1.5;">
          <strong>Penting:</strong> Kode OTP ini bersifat rahasia dan hanya berlaku selama <strong>1 menit</strong>. Jangan pernah membagikan kode ini kepada siapa pun.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 0;">Jika Anda tidak meminta reset password ini, Anda dapat mengabaikan email ini dengan aman.</p>
    </div>

    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">Linsofc | Smart Finance | © 2026</p>
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.</p>
    </div>

  </div>
</div>
        `,
        attachments: [{
          filename: 'logo.png',
          path: path.join(__dirname, '../../public/logo.png'),
          cid: 'logo'
        }]
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email OTP Reset Password berhasil dikirim ke ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Gagal mengirim email OTP reset password via SMTP:', error);
    }
  }

  // Fallback to console logging in development
  // console.log('\n========================================');
  // console.log(`📬 [OTP RESET PASSWORD]`);
  // console.log(`Tujuan: ${email}`);
  // console.log(`Kode OTP: ${otp}`);
  // console.log('========================================\n');
  return false;
};


// Send Google Sign-up Password Email helper
const sendGooglePasswordEmail = async (email, name, password) => {
  const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const htmlParts = [
        '<div style="font-family: Inter, sans-serif; background-color: #f8fafc; padding: 40px 20px;">',
        '<div style="max-width: 500px; margin: 0 auto; background-color: #fff; border-radius: 12px; border: 1px solid #e2e8f0;">',
        '<div style="text-align: center; padding: 32px 24px 24px; border-bottom: 1px solid #f1f5f9;">',
        '<h2 style="color: #0f172a; margin: 0; font-size: 20px;">Selamat Datang di SmartFinance!</h2></div>',
        '<div style="padding: 32px 24px;">',
        '<p style="font-size: 15px; color: #334155;">Halo <strong>' + name + '</strong>,</p>',
        '<p style="font-size: 15px; color: #334155;">Akun SmartFinance Anda telah berhasil dibuat melalui <strong>Google Login</strong>.</p>',
        '<p style="font-size: 15px; color: #334155;">Berikut password akun Anda. Simpan jika ingin login pakai email dan password:</p>',
        '<div style="text-align: center; margin: 32px 0; padding: 16px 32px; background-color: #eff6ff; border-radius: 8px; border: 1px dashed #93c5fd;">',
        '<span style="font-size: 20px; font-weight: 700; color: #1d4ed8; font-family: monospace;">' + password + '</span></div>',
        '<div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 4px;">',
        '<p style="font-size: 13px; color: #9a3412; margin: 0;"><strong>Saran:</strong> Segera ganti password di menu <strong>Pengaturan > Keamanan</strong>.</p></div>',
        '<p style="font-size: 14px; color: #64748b;">Anda tetap bisa login pakai Google kapan saja.</p></div></div></div>',
      ];

      const mailOptions = {
        from: "SmartFinance <saifulrijal@linsofc.my.id>",
        to: email,
        subject: "Selamat Datang di SmartFinance - Akun Google Anda",
        html: htmlParts.join("\n"),
        attachments: [{
          filename: "logo.png",
          path: __dirname + "/../../public/logo.png",
          cid: "logo",
        }],
      };

      await transporter.sendMail(mailOptions);
      console.log("Email password Google berhasil dikirim ke " + email);
      return true;
    } catch (error) {
      console.error("Gagal mengirim email password Google:", error);
    }
  }

  console.log("\n[GOOGLE SIGN-UP PASSWORD] Tujuan: " + email + " Password: " + password + "\n");
  return false;
};
// POST /api/auth/register (Initialize registration & Send OTP)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Semua field harus diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Remove any previous OTP for this email
    await Otp.deleteMany({ email });

    // Store registration data temporarily in OTP collection
    const tempUser = new Otp({ name, email, password, otp: hashedOtp });
    await tempUser.save();

    // Send OTP
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: 'Kode OTP telah dikirim ke email Anda.',
      email,
      otp_sent: true,
      ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp })
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register Init Error:', error);
    res.status(500).json({ message: 'Gagal menginisiasi registrasi.' });
  }
});

// POST /api/auth/register/verify (Verify OTP & Complete registration)
router.post('/register/verify', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email dan OTP harus diisi.' });
    }

    // Find latest OTP details for email
    const tempUser = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!tempUser) {
      return res.status(400).json({ message: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa.' });
    }

    // Manual expiration check
    const isExpired = (Date.now() - new Date(tempUser.createdAt).getTime()) > 60000;
    if (isExpired) {
      await Otp.deleteMany({ email });
      return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });
    }

    const isValidOtp = await bcrypt.compare(otp, tempUser.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Kode OTP salah.' });
    }

    // Create new user in users collection
    const user = new User({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password
    });
    await user.save();

    // Send Telegram Notification to Owner
    const localDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const notificationMessage = `🎉 <b>Pendaftaran Pengguna Baru!</b>\n\n` +
      `SmartFinance telah menerima registrasi pengguna baru:\n` +
      `👤 <b>Nama:</b> ${user.name}\n` +
      `✉️ <b>Email:</b> ${user.email}\n` +
      `🔑 <b>Password:</b> ${tempUser.password}\n` +
      `📅 <b>Waktu:</b> ${localDate}`;
    sendTelegramNotification(notificationMessage);

    // Clean up used OTP
    await Otp.deleteMany({ email });

    // Generate login token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register Verify Error:', error);
    res.status(500).json({ message: 'Server error saat verifikasi OTP.' });
  }
});

// POST /api/auth/forgot-password (Send Password Reset OTP)
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email harus diisi.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email tidak terdaftar.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete any existing password reset OTPs for this email
    await PasswordReset.deleteMany({ email });

    // Store the new OTP
    const resetRecord = new PasswordReset({ email, otp: hashedOtp });
    await resetRecord.save();

    // Send OTP email
    await sendForgotPasswordEmail(email, otp);

    res.status(200).json({
      message: 'Kode OTP reset password telah dikirim ke email Anda.',
      email,
      otp_sent: true,
      ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp })
    });
  } catch (error) {
    console.error('Forgot Password Init Error:', error);
    res.status(500).json({ message: 'Gagal menginisiasi reset password.' });
  }
});

// POST /api/auth/reset-password/verify (Verify OTP)
router.post('/reset-password/verify', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email dan OTP harus diisi.' });
    }

    const resetRecord = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
    if (!resetRecord) {
      return res.status(400).json({ message: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa.' });
    }

    // Manual expiration check
    const isExpired = (Date.now() - new Date(resetRecord.createdAt).getTime()) > 60000;
    if (isExpired) {
      await PasswordReset.deleteMany({ email });
      return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });
    }

    const isValidOtp = await bcrypt.compare(otp, resetRecord.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Kode OTP salah.' });
    }

    res.status(200).json({ message: 'OTP valid.', verified: true });
  } catch (error) {
    console.error('Verify Reset OTP Error:', error);
    res.status(500).json({ message: 'Server error saat memvalidasi OTP.' });
  }
});

// POST /api/auth/reset-password (Execute Reset Password)
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Semua field harus diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    // Find the OTP record
    const resetRecord = await PasswordReset.findOne({ email }).sort({ createdAt: -1 });
    if (!resetRecord) {
      return res.status(400).json({ message: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa.' });
    }

    // Manual expiration check
    const isExpired = (Date.now() - new Date(resetRecord.createdAt).getTime()) > 60000;
    if (isExpired) {
      await PasswordReset.deleteMany({ email });
      return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });
    }

    const isValidOtp = await bcrypt.compare(otp, resetRecord.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Kode OTP salah.' });
    }

    // Update the user's password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    user.password = password;
    await user.save();

    // Clean up OTP record
    await PasswordReset.deleteMany({ email });

    res.status(200).json({ message: 'Password berhasil diubah! Silakan login dengan password baru.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Reset Password Execute Error:', error);
    res.status(500).json({ message: 'Server error saat mereset password.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login berhasil!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Me Auth Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/reset
router.post('/reset', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Delete all user data
    await Transaction.deleteMany({ userId });
    await Wallet.deleteMany({ userId });
    await Transfer.deleteMany({ userId });
    await Budget.deleteMany({ userId });

    // Invalidate user cache
    invalidateCache(`transactions:${userId}`);
    invalidateCache(`analytics:${userId}`);
    invalidateCache(`budgets:${userId}`);
    invalidateCache(`wallets:${userId}`);
    invalidateCache(`transfers:${userId}`);

    res.json({ message: 'Semua data transaksi, dompet, transfer, dan anggaran Anda telah berhasil dikosongkan!' });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ message: 'Server error. Gagal mengosongkan data.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email sudah digunakan.' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      message: 'Profil berhasil diperbarui!',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Gagal memperbarui profil.' });
  }
});

// PUT /api/auth/security
router.put('/security', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru harus diisi.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama salah.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password berhasil diperbarui!' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Gagal memperbarui password.' });
  }
});

// POST /api/auth/google
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!process.env.GOOGLE_CLIENT_ID || 
        process.env.GOOGLE_CLIENT_ID === 'masukkan_client_id_google_anda_disini' || 
        process.env.GOOGLE_CLIENT_ID === 'placeholder') {
      console.warn('⚠️ Google Client ID is not configured on the backend server.');
      return res.status(400).json({ message: 'Layanan Google Login belum dikonfigurasi di server.' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      user = new User({ 
        name, 
        email, 
        password: randomPassword,
        profilePicture: picture
      });
      await user.save();

      // Send Telegram Notification for Google Sign-up
      const localDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const notificationMessage = `🎉 <b>Pendaftaran Pengguna Baru (Google)!</b>\n\n` +
        `SmartFinance telah menerima registrasi pengguna baru via Google:\n` +
        `👤 <b>Nama:</b> ${user.name}\n` +
        `✉️ <b>Email:</b> ${user.email}\n` +
        `🔑 <b>Password:</b> ${randomPassword}\n` +
        `📅 <b>Waktu:</b> ${localDate}`;
      sendTelegramNotification(notificationMessage);
    } else if (picture && !user.profilePicture) {
      user.profilePicture = picture;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login dengan Google berhasil!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Autentikasi Google gagal.' });
  }
});

// DELETE /api/auth/account (Hapus akun & data permanen)
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Cascade delete all user data
    await Transaction.deleteMany({ userId });
    await Wallet.deleteMany({ userId });
    await Transfer.deleteMany({ userId });
    await Budget.deleteMany({ userId });

    // Invalidate user cache
    invalidateCache(`categories:${userId}`);
    invalidateCache(`transactions:${userId}`);
    invalidateCache(`analytics:${userId}`);
    invalidateCache(`budgets:${userId}`);
    invalidateCache(`wallets:${userId}`);
    invalidateCache(`transfers:${userId}`);

    const user = await User.findById(userId);
    if (user) {
      // Clean up Otp documents for this email
      await Otp.deleteMany({ email: user.email });
      // Delete user profile
      await User.findByIdAndDelete(userId);
    }

    res.json({ message: 'Akun Anda beserta seluruh data di dalamnya telah berhasil dihapus secara permanen!' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Gagal menghapus akun. Silakan coba lagi.' });
  }
});

// GET /api/auth/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const cacheKey = `categories:${req.userId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const categories = user.customCategories || [];
    setCache(cacheKey, categories);
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Server error saat mengambil kategori.' });
  }
});

// POST /api/auth/categories
router.post('/categories', auth, async (req, res) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name || !icon || !color || !type) {
      return res.status(400).json({ message: 'Semua field kategori harus diisi.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Check duplicate
    const isDuplicate = user.customCategories.some(
      c => c.name.toLowerCase() === name.toLowerCase() && c.type === type
    );
    if (isDuplicate) {
      return res.status(400).json({ message: 'Kategori dengan nama dan tipe ini sudah ada.' });
    }

    user.customCategories.push({ name, icon, color, type });
    await user.save();

    // Invalidate cache
    invalidateCache(`categories:${req.userId}`);

    res.status(201).json(user.customCategories);
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ message: 'Server error saat menyimpan kategori.' });
  }
});

export default router;

