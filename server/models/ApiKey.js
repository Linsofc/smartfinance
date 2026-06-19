import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Nama API Key harus diisi'],
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;
