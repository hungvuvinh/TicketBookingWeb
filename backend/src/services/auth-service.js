const bcrypt = require('bcrypt');
const customerRepository = require('../repository/customer-repository');
const emailVerificationService = require('./email-verification-service');
const authAccountRepository = require('../repository/auth-account-repository');

const BCRYPT_SALT_ROUNDS = 10;

const mapCustomerPublicProfile = (customer) => ({
  customer_id: customer._id,
  customer_name: customer.customer_name,
  email: customer.email,
  phone_number: customer.phone_number,
  email_verified: customer.email_verified,
});

class AuthService {
  async register(payload) {
    const customerName = typeof payload.customer_name === 'string' ? payload.customer_name.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const phoneNumber = typeof payload.phone_number === 'string' ? payload.phone_number.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!customerName || !email || !phoneNumber || !password) {
      const error = new Error('customer_name, email, phone_number, and password are required');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error('Password must be at least 8 characters');
      error.statusCode = 400;
      throw error;
    }

    // ensure email not already used by any auth account
    const existingAccount = await authAccountRepository.findByEmail(email);
    if (existingAccount) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    // create customer record
    let customer = await customerRepository.create({
      customer_name: customerName,
      email,
      phone_number: phoneNumber,
    });

    // create auth account linking to customer
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await authAccountRepository.create({
      email,
      password_hash: passwordHash,
      account_type: 'customer',
      account_ref: customer._id,
    });

    const verification = await emailVerificationService.prepareVerification(customer);
    await customerRepository.save(customer);

    return {
      customer: mapCustomerPublicProfile(customer),
      verification,
    };
  }

  async login(payload) {
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!email || !password) {
      const error = new Error('email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const account = await authAccountRepository.findByEmailWithPassword(email);

    if (!account || !account.password_hash) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, account.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // load customer profile
    const customer = await customerRepository.findById(account.account_ref);

    return {
      customer: mapCustomerPublicProfile(customer),
      verification: {
        required: !account.email_verified,
        message: account.email_verified
          ? 'Email already verified'
          : 'Email verification scaffold is ready but the request flow is not enabled yet.',
      },
    };
  }
}

module.exports = new AuthService();
