import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromWalletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: [true, 'Dompet asal harus ditentukan']
  },
  toWalletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: [true, 'Dompet tujuan harus ditentukan']
  },
  amount: {
    type: Number,
    required: [true, 'Jumlah transfer harus diisi'],
    min: [1, 'Jumlah transfer harus lebih dari 0']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

transferSchema.index({ userId: 1, date: -1 });

const Transfer = mongoose.model('Transfer', transferSchema);
export default Transfer;
