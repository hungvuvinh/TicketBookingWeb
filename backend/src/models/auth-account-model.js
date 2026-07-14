const mongoose = require('mongoose');

const authAccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password_hash: {
    type: String,
    required: [true, 'Password hash is required'],
    select: false,
  },
  account_type: {
    type: String,
    enum: ['customer', 'dispatcher'],
    required: true,
  },
  account_ref: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  refresh_token: {
    type: String,
    select: false,
  },
  refresh_token_expires_at: {
    type: Date,
    select: false,
  },
}, { timestamps: true, collection: 'auth_accounts' });

const AuthAccount = mongoose.model('AuthAccount', authAccountSchema);

module.exports = AuthAccount;
