import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 // Automatically delete document after 1 minute (60 seconds)
  }
});

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
