const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes'); // Thêm authRoutes
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());

// Middleware phục vụ file tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); // Thêm route cho auth

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected successfully!');
    })
    .catch((err) => console.error('MongoDB connection error:', err));

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});