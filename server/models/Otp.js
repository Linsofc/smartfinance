import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama harus diisi'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password harus diisi']
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

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
