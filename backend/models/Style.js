import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Style = sequelize.define('Style', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  qualityId: { type: DataTypes.INTEGER, allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { timestamps: true });

export default Style;