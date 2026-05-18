import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const PriceMatrix = sequelize.define('PriceMatrix', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  styleId: { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  colorId: { type: DataTypes.INTEGER, allowNull: false },
  widthId: { type: DataTypes.INTEGER, allowNull: true },
  sizeId: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: true });

export default PriceMatrix;