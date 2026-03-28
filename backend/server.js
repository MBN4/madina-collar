const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
require('dotenv').config();

// IMPORT ALL MODELS HERE (Very important!)
const User = require('./models/User');
const Otp = require('./models/Otp');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

const app = express();
app.use(cors());
app.use(express.json());

// This will run sequelize.sync({ alter: true }) and create the tables
connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/order'));

app.get('/', (req, res) => res.send('Backend is running!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));