const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total_amount: { type: DataTypes.INTEGER, allowNull: false },
  payment_method: { type: DataTypes.STRING, allowNull: false },
  account_number: { type: DataTypes.STRING, allowNull: false },
  comments: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
});

Order.belongsTo(User, { foreignKey: 'userId' });
module.exports = Order;