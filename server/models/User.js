import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama harus diisi'],
    trim: true,
    minlength: [2, 'Nama minimal 2 karakter']
  },
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid']
  },
  password: {
    type: String,
    required: [true, 'Password harus diisi'],
    minlength: [6, 'Password minimal 6 karakter']
  },
  profilePicture: {
    type: String, // Store Base64 string
    default: ''
  },
  customCategories: {
    type: [
      {
        name: String,
        icon: String,
        color: String,
        type: { type: String, enum: ['INCOME', 'EXPENSE'] }
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  
  // Deteksi status premium secara dinamis berdasarkan email
  const premiumEmails = process.env.AKUN_PREM
    ? process.env.AKUN_PREM.split(',').map(e => e.trim().toLowerCase())
    : [];
  obj.isPremium = premiumEmails.includes(obj.email?.toLowerCase());
  
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
