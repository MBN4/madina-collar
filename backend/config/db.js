const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false, 
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected...');
    await sequelize.sync({ alter: true }); 
  } catch (err) {
    console.error('❌ Database Connection Error:', err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };