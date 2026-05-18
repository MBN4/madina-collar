import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total_amount: { type: DataTypes.INTEGER, allowNull: false },
  payment_method: { type: DataTypes.STRING, allowNull: false },
  bilti_info: { type: DataTypes.TEXT, allowNull: true },
  comments: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
}, { timestamps: true });

Order.belongsTo(User, { foreignKey: 'userId' });
export default Order;