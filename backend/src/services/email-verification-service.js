class EmailVerificationService {
  async prepareVerification(customer) {
    customer.email_verified = false;
    customer.email_verification = {
      requested_at: new Date(),
      token_hash: null,
      expires_at: null,
      verified_at: null,
    };

    return {
      queued: false,
      message: "Email verification workflow scaffold is ready but not enabled yet.",
    };
  }
}

module.exports = new EmailVerificationService();
