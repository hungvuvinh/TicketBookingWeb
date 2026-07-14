const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const app = require("./app");

const { expirePendingOrders } = require('./services/order-expiration-service');

expirePendingOrders().catch(console.error);
setInterval(() => expirePendingOrders().catch(console.error), 60_000);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
