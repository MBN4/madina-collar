import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const ProductAttribute = sequelize.define('ProductAttribute', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  styleId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('category', 'color', 'width', 'size'), allowNull: false },
  value: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.INTEGER, defaultValue: 0 },
  in_stock: { type: DataTypes.BOOLEAN, defaultValue: true },
  hex_code: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true });

export default ProductAttribute;