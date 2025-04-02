const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/user'); // Import User model

const vnp_TmnCode = "JAMQYX29"; // Mã website tại VNPAY
const vnp_HashSecret = "ESYLTZY5FBFCTSM16IMQUVCEHDTIQJD2"; // Chuỗi bí mật
const vnp_Url = "http://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = "http://localhost:5000/api/vnpay/vnpay_return";

// Function to generate a unique order ID
const generateOrderId = () => {
    return moment().format('DDHHmmss');
};

// Function to sort object properties alphabetically
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(key); // Không mã hóa URL ở đây
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = obj[str[key]];
    }
    return sorted;
}

exports.createPaymentURL = async (req, res) => {
    try {
        const { amount } = req.body;
        const createDate = moment().format('YYYYMMDDHHmmss');
        const orderId = generateOrderId();
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        const vnpUrl = new URL(vnp_Url);
        const vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnp_TmnCode,
            vnp_Amount: amount * 100,
            vnp_CreateDate: createDate,
            vnp_CurrCode: 'VND',
            vnp_IpAddr: ipAddr,
            vnp_Locale: 'vn',
            vnp_OrderInfo: 'Thanh toan don hang',
            vnp_OrderId: orderId,
            vnp_ReturnUrl: vnp_ReturnUrl,
            vnp_TxnRef: orderId,
            vnp_Inv_Id: orderId,
        };

        // In ra các tham số để kiểm tra
        console.log("vnp_Params:", vnp_Params);

        // Sắp xếp các tham số theo thứ tự alphabet
        const sortedParams = sortObject(vnp_Params);

        // Tạo chuỗi truy vấn
        let signData = querystring.stringify(sortedParams, { encode: false });

        // Loại bỏ mã hóa URL ở đây
        // signData = encodeURIComponent(signData);

        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        vnpUrl.searchParams.append('vnp_Version', vnp_Params.vnp_Version);
        vnpUrl.searchParams.append('vnp_Command', vnp_Params.vnp_Command);
        vnpUrl.searchParams.append('vnp_TmnCode', vnp_Params.vnp_TmnCode);
        vnpUrl.searchParams.append('vnp_Amount', vnp_Params.vnp_Amount);
        vnpUrl.searchParams.append('vnp_CreateDate', vnp_Params.vnp_CreateDate);
        vnpUrl.searchParams.append('vnp_CurrCode', vnp_Params.vnp_CurrCode);
        vnpUrl.searchParams.append('vnp_IpAddr', vnp_Params.vnp_IpAddr);
        vnpUrl.searchParams.append('vnp_Locale', vnp_Params.vnp_Locale);
        vnpUrl.searchParams.append('vnp_OrderInfo', vnp_Params.vnp_OrderInfo);
        vnpUrl.searchParams.append('vnp_OrderId', vnp_Params.vnp_OrderId);
        vnpUrl.searchParams.append('vnp_ReturnUrl', vnp_Params.vnp_ReturnUrl);
        vnpUrl.searchParams.append('vnp_TxnRef', vnp_Params.vnp_TxnRef);
        vnpUrl.searchParams.append('vnp_Inv_Id', vnp_Params.vnp_Inv_Id);
        vnpUrl.searchParams.append('vnp_SecureHash', signed);

        // In ra URL thanh toán để kiểm tra
        console.log("vnpUrl.href:", vnpUrl.href);

        // Tạo chuỗi truy vấn để kiểm tra
        let checkSignData = querystring.stringify(sortedParams, { encode: false });

        // In ra chuỗi truy vấn để kiểm tra
        console.log("Check Sign Data:", checkSignData);

        const checkHmac = crypto.createHmac('sha512', vnp_HashSecret);
        const checkSigned = checkHmac.update(Buffer.from(checkSignData, 'utf-8')).digest("hex");

        // In ra chữ ký để kiểm tra
        console.log("Check Generated Signature:", checkSigned);
        console.log("Return URL:", vnp_ReturnUrl); // In ra Return URL

        res.status(200).json({ code: '200', data: vnpUrl.href });
    } catch (e) {
        console.log(e);
        res.status(500).json({ code: '500', message: 'Error creating payment URL' });
    }
};

exports.vnpayReturn = async (req, res) => {
    try {
        console.log("VNPAY Return Params:", req.query); // In ra các tham số trả về

        let vnp_Params = req.query;

        console.log("VNPAY Return Params:", vnp_Params);

        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", vnp_HashSecret);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        console.log("Generated Signature:", signed);
        console.log("VNPAY Signature:", secureHash);

        if (secureHash === signed) {
            //Kiem tra xem du lieu co hop le khong, xem Amount va CurrencyCode co dung khong
            //Xu ly thanh cong, cap nhat trang thai don hang
            // Ở đây bạn cần cập nhật trạng thái đơn hàng trong database của bạn
            console.log("Checksum OK!");

            // Find the user and update wallet balance
            const orderId = vnp_Params['vnp_TxnRef'];
            const amount = parseInt(vnp_Params['vnp_Amount']) / 100; // Amount from VNPAY

             // Find the user and update wallet balance
             const userId = req.user.id; // Assuming you have user info in req.user
             const user = await User.findById(userId);

             if (!user) {
                 return res.status(404).json({ code: '01', message: 'User not found' });
             }

             user.walletBalance += amount;
             await user.save();

            res.json({ code: '00', message: 'success' });
        } else {
            console.log("Checksum FAILED!");
            res.json({ code: '97', message: 'Fail checksum' });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ code: '99', message: 'Error processing payment' });
    }
};

// New function to handle payment from wallet
exports.payWithWallet = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id; // Assuming you have user info in req.user

        const user = await User.findById(userId).populate('cart');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.cart.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const products = user.cart.map(product => ({ product: product._id }));
        const totalPrice = user.cart.reduce((total, product) => total + product.price, 0);

        if (user.walletBalance < totalPrice) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Create order
        const order = new Order({
            user: userId,
            products,
            paymentMethod: 'Wallet', // Payment method is wallet
            totalPrice,
            shippingAddress: { // You might want to get shipping address from request
                address: 'N/A',
                phone: 'N/A',
                email: 'N/A'
            }
        });

        await order.save();

        // Update user's wallet balance
        user.walletBalance -= totalPrice;
        user.cart = []; // Clear the cart
        await user.save();

        res.status(201).json({ message: 'Order created successfully using wallet balance', order });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing payment with wallet', error });
    }
};