import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas to match the models
const apiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  key: String,
  isActive: Boolean,
  lastUsed: Date
}, { collection: 'apikeys' });

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  balance: Number,
  type: String
}, { collection: 'wallets' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String
}, { collection: 'users' });

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: Date,
  type: String,
  category: String,
  amount: Number,
  note: String,
  walletId: mongoose.Schema.Types.ObjectId
}, { collection: 'transactions' });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const key = 'sf_key_32df54724ea8012367c097de5e2306a8a88d34fd29c3d35a';
    const apiKeyDoc = await ApiKey.findOne({ key }).populate('userId');
    if (!apiKeyDoc) {
      console.log('❌ API Key not found!');
      mongoose.disconnect();
      return;
    }

    console.log('Found API Key Doc:', JSON.stringify(apiKeyDoc, null, 2));

    const userId = apiKeyDoc.userId._id;
    const userDoc = await User.findById(userId);
    console.log('User:', JSON.stringify(userDoc, null, 2));

    const wallets = await Wallet.find({ userId });
    console.log('Wallets count:', wallets.length);
    console.log('Wallets:', JSON.stringify(wallets, null, 2));

    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(5);
    console.log('Recent 5 transactions:', JSON.stringify(transactions, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
