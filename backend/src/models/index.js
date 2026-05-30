// Central model loader to ensure schemas are registered before use
require('./operator-model');
require('./vehicle-model');
require('./route-model');
require('./trip-model');
require('./ticket-model');
require('./payment-model');
require('./order-model');
require('./dispatcher-model');
require('./customer-model');
require('./auth-account-model');

module.exports = {};
