const User = require('../models/user');

// Lấy giỏ hàng của người dùng
exports.getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart');
        res.json(user.cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
};

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const productId = req.body.productId;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        if (user.cart.includes(productId)) {
            return res.status(400).json({ message: 'Product already in cart' });
        }

        user.cart.push(productId);
        await user.save();

        res.status(200).json({ message: 'Product added to cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding to cart' });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const productId = req.params.productId;
        user.cart = user.cart.filter(item => item.toString() !== productId);
        await user.save();

        res.status(200).json({ message: 'Product removed from cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing from cart' });
    }
};