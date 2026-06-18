import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Tanggal harus diisi'],
    default: Date.now
  },
  type: {
    type: String,
    required: [true, 'Tipe transaksi harus diisi'],
    enum: {
      values: ['INCOME', 'EXPENSE'],
      message: 'Tipe harus INCOME atau EXPENSE'
    }
  },
  category: {
    type: String,
    required: [true, 'Kategori harus diisi'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Jumlah harus diisi'],
    min: [0, 'Jumlah tidak boleh negatif']
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries by user and date
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
