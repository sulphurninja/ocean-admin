import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  subs_credentials: {
    user_name: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  plan_expiry: { type: Date, required: true },
  devices: { type: [String], default: [] },
  role: {
    type: String,
    enum: ['admin', 'seller', 'user'],
    default: 'user'
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{
      amount: Number,
      description: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  userCreationCharge: { type: Number, default: 0 },
  // For sellers - track which users they've created
  createdUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // For users - track which seller created them
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAdmin: { type: Boolean, default: false }, // Keeping for backward compatibility
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
