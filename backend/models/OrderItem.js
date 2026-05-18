import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: true }, // Changed to true
  quality: { type: DataTypes.STRING, allowNull: true },  // Changed to true
  style: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: true },
  width: { type: DataTypes.STRING, allowNull: true },
  size: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: true }, // Changed to true
  price_at_purchase: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 } // Changed to true
}, { timestamps: true });

export default OrderItem;