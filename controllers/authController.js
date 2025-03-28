const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Tạo token JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Đăng ký tài khoản
exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Kiểm tra username hoặc email đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        // Tạo user mới
        const user = new User({ username, email, password, role: role || 'user' });
        await user.save();

        // Trả về thông báo thành công
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra username
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Tạo token
        const token = generateToken(user._id, user.role);

        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};