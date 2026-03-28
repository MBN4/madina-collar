const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Otp = sequelize.define('Otp', {
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otp_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = Otp;