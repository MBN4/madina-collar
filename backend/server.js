import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { connectDB, sequelize } from './config/db.js';

import User from './models/User.js';
import Otp from './models/Otp.js';
import Order from './models/Order.js';
import OrderItem from './models/OrderItem.js';
import Quality from './models/Quality.js';
import Style from './models/Style.js';
import ProductAttribute from './models/ProductAttribute.js';
import PriceMatrix from './models/PriceMatrix.js';
import BlacklistedToken from './models/BlacklistedToken.js';

import authRoutes from './routes/auth.js';
import orderRoutes from './routes/order.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Updated CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

Quality.hasMany(Style, { foreignKey: 'qualityId', onDelete: 'CASCADE' });
Style.belongsTo(Quality, { foreignKey: 'qualityId' });
Style.hasMany(ProductAttribute, { foreignKey: 'styleId', onDelete: 'CASCADE' });
ProductAttribute.belongsTo(Style, { foreignKey: 'styleId' });
Style.hasMany(PriceMatrix, { foreignKey: 'styleId', onDelete: 'CASCADE' });
PriceMatrix.belongsTo(Style, { foreignKey: 'styleId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('Active'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));