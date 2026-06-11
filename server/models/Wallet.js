import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Nama dompet harus diisi'],
    trim: true
  },
  balance: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  color: {
    type: String,
    default: '#6a4cf5'
  }
}, {
  timestamps: true
});

walletSchema.index({ userId: 1 });

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;
