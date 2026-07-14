const vnpayService = require('../services/vnpay-service');
const paymentRepository = require('../repository/payment-repository');
const orderRepository = require('../repository/order-repository');
const ticketRepository = require('../repository/ticket-repository');
const Order = require('../models/order-model');
const Payment = require('../models/payment-model');
const Ticket = require('../models/ticket-model');


const createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, bankCode, ipAddress } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'orderId and amount are required'
            });
        }

        // Kiểm tra order tồn tại
        const order = await Order.findById(orderId).populate('tickets customer');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Kiểm tra order chưa thanh toán
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Order status is ${order.status}, cannot create payment`
            });
        }

        // Kiểm tra payment đã tồn tại cho order này
        let payment = await Payment.findOne({ order: orderId, status: 'pending' });
        
        if (!payment) {
            // Tạo Payment record nếu chưa có
            payment = await Payment.create({
                amount,
                customer: order.customer._id,
                order: orderId,
                payment_type: 'vnpay',
                reference_number: `VNP-${orderId}-${Date.now()}`,
                executed_at: new Date().toISOString(),
                status: 'pending'
            });
        }

        // Tạo payment URL VNPay
        const orderInfo = `Thanh toan don hang ${orderId} - ${order.tickets.length} ve`;
        const paymentResult = vnpayService.createPaymentUrl({
            orderId: payment._id.toString(),
            amount,
            orderInfo,
            bankCode: bankCode || '',
            customerEmail: order.customer.email || '',
            customerPhone: order.customer.phone_number || '',
            ipAddress: ipAddress || '127.0.0.1'
        });

        // Lưu transaction ref vào payment
        payment.vnpay_transaction_id = paymentResult.transactionRef;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: 'Payment URL created successfully',
            data: {
                paymentUrl: paymentResult.paymentUrl,
                paymentId: payment._id,
                transactionRef: paymentResult.transactionRef,
                amount,
                orderInfo
            }
        });
    } catch (error) {
        console.error('Create payment URL error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

/**
 * Xử lý return từ VNPay (User redirect về)
 * GET /api/payments/vnpay/return
 */
const paymentReturn = async (req, res) => {
    try {
        const vnp_Params = req.query;

        // Xác minh signature
        const verifyResult = vnpayService.verifyIpnCallback(vnp_Params);

        if (!verifyResult.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature',
                responseCode: verifyResult.responseCode
            });
        }

        // Tìm payment bằng paymentId từ orderId
        const payment = await Payment.findById(verifyResult.orderId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Cập nhật payment info
        payment.vnpay_transaction_id = verifyResult.transactionNo;
        payment.vnpay_response_code = verifyResult.responseCode;
        payment.bank_code = verifyResult.bankCode;

        // Xử lý status
        if (verifyResult.responseCode === '00') {
            // Thanh toán thành công
            payment.status = 'success';
            await payment.save();

            // Cập nhật order và tickets
            const order = await Order.findById(payment.order);
            if (order) {
                order.status = 'paid';
                await order.save();

                // Cập nhật tickets status
                await Ticket.updateMany(
                    { _id: { $in: order.tickets } },
                    { status: 'confirmed' }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Payment successful',
                data: {
                    paymentId: payment._id,
                    orderId: payment.order,
                    status: 'success',
                    amount: payment.amount,
                    transactionNo: verifyResult.transactionNo
                }
            });
        } else {
            // Thanh toán thất bại
            payment.status = 'failed';
            await payment.save();

            return res.status(200).json({
                success: false,
                message: `Payment failed: ${vnpayService.getResponseCodeMessage(verifyResult.responseCode)}`,
                data: {
                    paymentId: payment._id,
                    responseCode: verifyResult.responseCode,
                    status: 'failed'
                }
            });
        }
    } catch (error) {
        console.error('Payment return error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

/**
 * Xử lý IPN callback từ VNPay (Server to Server)
 * POST /api/payments/vnpay/ipn
 */
const paymentIpn = async (req, res) => {
    try {
        const vnp_Params = req.query;

        // Xác minh signature
        const verifyResult = vnpayService.verifyIpnCallback(vnp_Params);

        if (!verifyResult.isValid) {
            return res.status(200).json({
                RspCode: '97',
                Message: 'Invalid signature'
            });
        }

        // Tìm payment
        const payment = await Payment.findById(verifyResult.orderId);
        if (!payment) {
            return res.status(200).json({
                RspCode: '01',
                Message: 'Payment not found'
            });
        }

        // Kiểm tra amount
        if (Math.floor(payment.amount * 100) !== parseInt(verifyResult.amount)) {
            return res.status(200).json({
                RspCode: '04',
                Message: 'Invalid amount'
            });
        }

        // Nếu đã xử lý rồi
        if (payment.status !== 'pending') {
            return res.status(200).json({
                RspCode: '00',
                Message: 'Already processed'
            });
        }

        // Cập nhật payment
        payment.vnpay_transaction_id = verifyResult.transactionNo;
        payment.vnpay_response_code = verifyResult.responseCode;
        payment.bank_code = verifyResult.bankCode;

        if (verifyResult.responseCode === '00') {
            // Thanh toán thành công
            payment.status = 'success';
            await payment.save();

            // Cập nhật order
            const order = await Order.findById(payment.order);
            if (order && order.status === 'pending') {
                order.status = 'paid';
                await order.save();

                // Cập nhật tickets
                await Ticket.updateMany(
                    { _id: { $in: order.tickets } },
                    { status: 'confirmed' }
                );
            }

            return res.status(200).json({
                RspCode: '00',
                Message: 'Confirm received'
            });
        } else {
            // Thanh toán thất bại
            payment.status = 'failed';
            await payment.save();

            return res.status(200).json({
                RspCode: '00',
                Message: 'Confirm received'
            });
        }
    } catch (error) {
        console.error('IPN callback error:', error);
        return res.status(200).json({
            RspCode: '99',
            Message: 'Server error'
        });
    }
};

/**
 * Hoàn tiền
 * POST /api/payments/vnpay/refund
 */
const refundPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'paymentId is required'
            });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status !== 'success') {
            return res.status(400).json({
                success: false,
                message: `Cannot refund payment with status ${payment.status}`
            });
        }

        if (!payment.vnpay_transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'No VNPay transaction to refund'
            });
        }

        // Gọi VNPay refund API
        const refundResult = await vnpayService.refund({
            transactionNo: payment.vnpay_transaction_id,
            transactionDate: payment.executed_at.substring(0, 8),
            amount: payment.amount,
            transactionType: '02'
        });

        if (!refundResult.success) {
            return res.status(400).json({
                success: false,
                message: refundResult.message || 'Refund failed'
            });
        }

        // Cập nhật payment status
        payment.status = 'refunded';
        await payment.save();

        // Cập nhật order status
        const order = await Order.findById(payment.order);
        if (order) {
            order.status = 'cancelled';
            await order.save();

            // Cập nhật tickets
            await Ticket.updateMany(
                { _id: { $in: order.tickets } },
                { status: 'cancelled' }
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Refund successful',
            data: {
                paymentId: payment._id,
                status: 'refunded',
                amount: payment.amount
            }
        });
    } catch (error) {
        console.error('Refund error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

/**
 * Lấy thông tin payment
 * GET /api/payments/vnpay/:paymentId
 */
const getPaymentInfo = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)
            .populate('customer')
            .populate('order');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Get payment error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

module.exports = {
    createPaymentUrl,
    paymentReturn,
    paymentIpn,
    refundPayment,
    getPaymentInfo
};