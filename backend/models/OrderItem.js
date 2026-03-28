const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Order = require('./Order');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quality: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false }
});

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
module.exports = OrderItem;