const mongoose = require('mongoose');
const Order = require('../models/order-model');
const Ticket = require('../models/ticket-model');

const EXPIRE_MINUTES = 10;

async function expirePendingOrders() {
  const cutoff = new Date(Date.now() - EXPIRE_MINUTES * 60_000);

  // Tìm order pending cũ hơn cutoff (dùng booked_at)
  const orders = await Order.find({
    status: 'pending',
    booked_at: { $lt: cutoff }
  }).select('_id tickets');

  if (!orders.length) return;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    for (const order of orders) {
      // Giải phóng vé chỉ khi vé đang 'pending' (an toàn)
      await Ticket.updateMany(
        { _id: { $in: order.tickets }, status: 'pending' },
        { $set: { status: 'available' } },
        { session }
      );

      order.status = 'expired';
      await order.save({ session });
    }
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { expirePendingOrders };