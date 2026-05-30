const AuthAccount = require('../models/auth-account-model');

class AuthAccountRepository {
  async create(data) {
    return AuthAccount.create(data);
  }

  async findByEmail(email) {
    return AuthAccount.findOne({ email });
  }

  async findByEmailWithPassword(email) {
    return AuthAccount.findOne({ email }).select('+password_hash');
  }

  async findById(id) {
    return AuthAccount.findById(id);
  }

  async findByAccountRef(ref) {
    return AuthAccount.findOne({ account_ref: ref });
  }

  async update(id, updateData) {
    return AuthAccount.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async delete(id) {
    return AuthAccount.findByIdAndDelete(id);
  }
}

module.exports = new AuthAccountRepository();
