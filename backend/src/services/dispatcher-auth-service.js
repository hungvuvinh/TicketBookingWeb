const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dispatcherRepository = require('../repository/dispatcher-repository');
const authAccountRepository = require('../repository/auth-account-repository');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const BCRYPT_SALT_ROUNDS = 10;

class DispatcherAuthService {
  async register(payload) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const phone = typeof payload.phone_number === 'string' ? payload.phone_number.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!name || !email || !phone || !password) {
      const error = new Error('name, email, phone_number and password are required');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error('Password must be at least 8 characters');
      error.statusCode = 400;
      throw error;
    }

    const existingAccount = await authAccountRepository.findByEmail(email);
    if (existingAccount) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    // create dispatcher record
    let dispatcher = await dispatcherRepository.create({ name, email, phone_number: phone });

    // create auth account for dispatcher
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const authAccount = await authAccountRepository.create({
      email,
      password_hash: passwordHash,
      account_type: 'dispatcher',
      account_ref: dispatcher._id,
    });

    const accessToken = jwt.sign({ sub: dispatcher._id.toString(), role: 'dispatcher' }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: dispatcher._id.toString(), role: 'dispatcher' }, JWT_SECRET, { expiresIn: '3d' });

    // Store refresh token
    await authAccountRepository.update(authAccount._id, {
      refresh_token: refreshToken,
      refresh_token_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    return { dispatcher: { id: dispatcher._id, name: dispatcher.name, email: dispatcher.email }, accessToken, refreshToken };
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

    const ok = await bcrypt.compare(password, account.password_hash);
    if (!ok) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // fetch dispatcher profile
    const dispatcher = await dispatcherRepository.findById(account.account_ref);

    const accessToken = jwt.sign({ sub: dispatcher._id.toString(), role: 'dispatcher' }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: dispatcher._id.toString(), role: 'dispatcher' }, JWT_SECRET, { expiresIn: '3d' });

    // Store refresh token
    await authAccountRepository.update(account._id, {
      refresh_token: refreshToken,
      refresh_token_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    return { dispatcher: { id: dispatcher._id, name: dispatcher.name, email: dispatcher.email }, accessToken, refreshToken };
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
      const dispatcher = await dispatcherRepository.findById(account.account_ref);
      const newAccessToken = jwt.sign({ sub: dispatcher._id.toString(), role: 'dispatcher' }, JWT_SECRET, { expiresIn: '15m' });

      return {
        dispatcher: { id: dispatcher._id, name: dispatcher.name, email: dispatcher.email },
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

module.exports = new DispatcherAuthService();
