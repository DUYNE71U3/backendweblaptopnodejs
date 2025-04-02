const Order = require('../models/order');
const User = require('../models/user');

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;
        const user = await User.findById(req.user.id).populate('cart');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.cart.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const products = user.cart.map(product => ({ product: product._id }));
        const totalPrice = user.cart.reduce((total, product) => total + product.price, 0);

        const order = new Order({
            user: req.user.id,
            products,
            shippingAddress,
            paymentMethod,
            totalPrice
        });

        await order.save();

        // Xóa giỏ hàng sau khi tạo đơn hàng thành công
        user.cart = [];
        await user.save();

        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating order', error });
    }
};

// Lấy tất cả đơn hàng (chỉ admin)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'username').populate('products.product', 'name price');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

// Cập nhật trạng thái đơn hàng (chỉ admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order status', error });
    }
};

// Lấy danh sách đơn hàng của người dùng
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ user: userId }).populate('products.product', 'name price');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user orders', error });
    }
};