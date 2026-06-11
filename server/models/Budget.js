import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Kategori harus diisi'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Jumlah anggaran harus diisi'],
    min: [0, 'Jumlah anggaran tidak boleh negatif']
  },
  icon: {
    type: String,
    default: '💰'
  }
}, {
  timestamps: true
});

// A user should only have one budget per category
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
