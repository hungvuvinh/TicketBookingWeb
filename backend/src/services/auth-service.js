const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const customerRepository = require('../repository/customer-repository');
const emailVerificationService = require('./email-verification-service');
const authAccountRepository = require('../repository/auth-account-repository');

const BCRYPT_SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

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

    const accessToken = jwt.sign({ sub: customer._id.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: customer._id.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '3d' });

    // Store refresh token
    const authAccount = await authAccountRepository.findByEmail(email);
    await authAccountRepository.update(authAccount._id, {
      refresh_token: refreshToken,
      refresh_token_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    return {
      customer: mapCustomerPublicProfile(customer),
      accessToken,
      refreshToken,
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

    const accessToken = jwt.sign({ sub: customer._id.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: customer._id.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '3d' });

    // Store refresh token
    await authAccountRepository.update(account._id, {
      refresh_token: refreshToken,
      refresh_token_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    return {
      customer: mapCustomerPublicProfile(customer),
      accessToken,
      refreshToken,
      verification: {
        required: !account.email_verified,
        message: account.email_verified
          ? 'Email already verified'
          : 'Email verification scaffold is ready but the request flow is not enabled yet.',
      },
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 400;
      throw error;
    }

    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);
      
      // Find the auth account with this refresh token
      const account = await authAccountRepository.findOneWithFields({ refresh_token: refreshToken }, '+refresh_token +refresh_token_expires_at');
      
      if (!account) {
        const error = new Error('Invalid refresh token');
        error.statusCode = 401;
        throw error;
      }

      if (new Date() > account.refresh_token_expires_at) {
        const error = new Error('Refresh token has expired');
        error.statusCode = 401;
        throw error;
      }

      // Generate new access token
      const customer = await customerRepository.findById(account.account_ref);
      const newAccessToken = jwt.sign({ sub: customer._id.toString(), role: 'user' }, JWT_SECRET, { expiresIn: '15m' });

      return {
        customer: mapCustomerPublicProfile(customer),
        accessToken: newAccessToken,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }
  }
}

module.exports = new AuthService();
