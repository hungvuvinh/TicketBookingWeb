const crypto = require('crypto');
const axios = require('axios');

const readEnv = (...names) => {
    for (const name of names) {
        const value = process.env[name];
        if (value && String(value).trim()) {
            return String(value).trim();
        }
    }

    return undefined;
};

class VNPayService {
    constructor() {
        this.vnp_TmnCode = readEnv('VNP_TMNCODE');
        this.vnp_HashSecret = readEnv('VNP_HASHSECRET');
        this.vnp_Url = readEnv('VNP_URL') || 'https://sandbox.vnpayment.vn/paygate/api/transaction';
        this.vnp_ReturnUrl = readEnv('VNP_RETURN_URL', 'VNP_RETURNURL');
        this.vnp_IpnUrl = readEnv('VNP_IPN_URL', 'VNP_IPNURL');
        this.vnp_ApiUrl = readEnv('VNP_APIURL') || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    }

    /**
     * Tạo URL thanh toán VNPay
     * @param {Object} params - { orderId, amount, orderInfo, bankCode, customerEmail, customerPhone, ipAddress }
     * @returns {String} - VNPay payment URL
     */
    createPaymentUrl(params) {
        const {
            orderId,
            amount,
            orderInfo = 'Thanh toan don hang',
            bankCode = '',
            customerEmail = '',
            customerPhone = '',
            ipAddress = '127.0.0.1'
        } = params;

        if (!orderId || !amount) {
            throw new Error('orderId and amount are required');
        }

        // VNPay yêu cầu amount phải là số nguyên (VND)
        const amountInt = Math.floor(amount * 100); // Chuyển sang đơn vị nhỏ nhất
        const txnRef = `${orderId}-${Date.now()}`;
        const createDate = this.getCurrentFormattedDate();

        // Tạo TreeMap (Object với keys đã sort)
        let vnp_Params = {
            vnp_Amount: String(amountInt),
            vnp_Command: 'pay',
            vnp_CreateDate: createDate,
            vnp_CurrCode: 'VND',
            vnp_IpAddr: ipAddress,
            vnp_Locale: 'vn',
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_ReturnUrl: this.vnp_ReturnUrl,
            vnp_TmnCode: this.vnp_TmnCode,
            vnp_TxnRef: txnRef,
            vnp_Version: '2.1.0'
        };

        // Nếu có bankCode, thêm vào (sắp xếp alphabetically)
        if (bankCode && bankCode.trim()) {
            vnp_Params = this.sortObject({ ...vnp_Params, vnp_BankCode: bankCode });
        } else {
            vnp_Params = this.sortObject(vnp_Params);
        }

        // Tạo canonical query string (giống URLEncoder.encode trong Java)
        const signData = this.buildQueryString(vnp_Params);
        
        // Tính HMAC-SHA512
        const hmac = crypto
            .createHmac('sha512', this.vnp_HashSecret)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        const paymentUrl = `${this.vnp_Url}?${signData}&vnp_SecureHash=${hmac}`;

        return {
            paymentUrl,
            transactionRef: txnRef
        };
    }

    buildQueryString(params) {
        const parts = [];
        for (const [key, value] of Object.entries(params)) {
            // Encode giống application/x-www-form-urlencoded (spaces → '+')
            const encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
            const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, '+');
            parts.push(`${encodedKey}=${encodedValue}`);
        }
        return parts.join('&');
    }

    /**
     * Xác minh IPN callback từ VNPay
     * @param {Object} vnp_Params - Query parameters từ VNPay callback
     * @returns {Object} - { isValid: boolean, message: string, data: {...} }
     */
    verifyIpnCallback(vnp_Params) {
        const secureHash = vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHash;
        delete vnp_Params.vnp_SecureHashType;

        // Sắp xếp theo alphabet
        const sortedParams = this.sortObject(vnp_Params);
        
        // Tạo canonical query string (giống buildQueryString)
        const signData = this.buildQueryString(sortedParams);

        // Tính HMAC-SHA512
        const hmac = crypto
            .createHmac('sha512', this.vnp_HashSecret)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        const isValid = hmac.toLowerCase() === secureHash.toLowerCase();

        return {
            isValid,
            responseCode: vnp_Params.vnp_ResponseCode,
            transactionNo: vnp_Params.vnp_TransactionNo,
            transactionStatus: vnp_Params.vnp_TransactionStatus,
            orderId: vnp_Params.vnp_OrderInfo,
            amount: vnp_Params.vnp_Amount,
            bankCode: vnp_Params.vnp_BankCode,
            bankTranNo: vnp_Params.vnp_BankTranNo,
            payDate: vnp_Params.vnp_PayDate,
            message: isValid ? 'Signature verified' : 'Invalid signature'
        };
    }

    /**
     * Kiểm tra trạng thái giao dịch VNPay
     * @param {String} transactionNo - Mã giao dịch VNPay
     * @param {String} transactionDate - Ngày giao dịch (yyyyMMdd)
     * @returns {Promise<Object>}
     */
    async queryTransaction(transactionNo, transactionDate) {
        try {
            const query_Params = {
                vnp_Command: 'querydr',
                vnp_CreateDate: this.getCurrentFormattedDate(),
                vnp_RequestId: `${Date.now()}`,
                vnp_TmnCode: this.vnp_TmnCode,
                vnp_TransactionDate: transactionDate,
                vnp_TxnRef: transactionNo,
                vnp_Version: '2.1.0'
            };

            const sortedParams = this.sortObject(query_Params);
            const signData = this.buildQueryString(sortedParams);
            const hmac = crypto
                .createHmac('sha512', this.vnp_HashSecret)
                .update(Buffer.from(signData, 'utf-8'))
                .digest('hex');

            sortedParams.vnp_SecureHash = hmac;

            const response = await axios.post(this.vnp_ApiUrl, sortedParams);

            return {
                success: response.data.vnp_ResponseCode === '00',
                data: response.data
            };
        } catch (error) {
            console.error('Query transaction error:', error);
            throw new Error('Failed to query VNPay transaction');
        }
    }

    /**
     * Hoàn tiền giao dịch
     * @param {Object} params - { transactionNo, transactionDate, amount, transactionType }
     * @returns {Promise<Object>}
     */
    async refund(params) {
        try {
            const {
                transactionNo,
                transactionDate,
                amount,
                transactionType = '02'
            } = params;

            const refund_Params = {
                vnp_Amount: Math.floor(amount * 100),
                vnp_Command: 'refund',
                vnp_CreateDate: this.getCurrentFormattedDate(),
                vnp_IpAddr: '127.0.0.1',
                vnp_RequestId: `${Date.now()}`,
                vnp_TmnCode: this.vnp_TmnCode,
                vnp_TransactionDate: transactionDate,
                vnp_TransactionType: transactionType,
                vnp_TxnRef: transactionNo,
                vnp_Version: '2.1.0'
            };

            const sortedParams = this.sortObject(refund_Params);
            const signData = this.buildQueryString(sortedParams);
            const hmac = crypto
                .createHmac('sha512', this.vnp_HashSecret)
                .update(Buffer.from(signData, 'utf-8'))
                .digest('hex');

            sortedParams.vnp_SecureHash = hmac;

            const response = await axios.post(this.vnp_ApiUrl, sortedParams);

            return {
                success: response.data.vnp_ResponseCode === '00',
                message: response.data.vnp_Message,
                data: response.data
            };
        } catch (error) {
            console.error('Refund error:', error);
            throw new Error('Failed to refund VNPay transaction');
        }
    }

    /**
     * Sắp xếp object theo key alphabet
     */
    sortObject(obj) {
        return Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});
    }

    /**
     * Lấy ngày giờ hiện tại theo định dạng VNPay (yyyyMMddHHmmss)
     */
    getCurrentFormattedDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}${month}${date}${hours}${minutes}${seconds}`;
    }

    /**
     * Format response code VNPay thành message
     */
    getResponseCodeMessage(code) {
        const messages = {
            '00': 'Giao dịch thành công',
            '01': 'Giao dịch bị từ chối',
            '02': 'Merchant khoá tài khoản',
            '03': 'Địa chỉ IP không được phép',
            '04': 'Không hỗ trợ loại tiền tệ',
            '05': 'Giao dịch không hợp lệ',
            '07': 'Trùng lặp dữ liệu',
            '08': 'Merchant không tồn tại',
            '09': 'Giao dịch không hợp lệ',
            '10': 'Định dạng dữ liệu không đúng',
            '11': 'Nhập sai mật khẩu quá 3 lần',
            '12': 'Tài khoản khách hàng bị khóa',
            '13': 'Sai định dạng dữ liệu',
            '99': 'Lỗi không xác định'
        };

        return messages[code] || 'Mã lỗi không xác định';
    }
}

module.exports = new VNPayService();