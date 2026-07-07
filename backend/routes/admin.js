import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { Sequelize, Op } from 'sequelize';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import OrderItem from '../models/OrderItem.js';
import Quality from '../models/Quality.js';
import Style from '../models/Style.js';
import ProductAttribute from '../models/ProductAttribute.js';
import PriceMatrix from '../models/PriceMatrix.js';
import BlacklistedToken from '../models/BlacklistedToken.js';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const isMaster = (req) => req.user && (req.user.role === 'superadmin' || req.user.role === 'admin');

router.get('/dashboard-stats', auth, adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalUsers = await User.count({ where: { role: 'user' } });
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const revenueResult = await Order.sum('total_amount');
    res.json({ totalOrders, totalUsers, pendingOrders, totalRevenue: revenueResult || 0 });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const revenueData = await Order.findAll({
      attributes: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'], [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'revenue']],
      where: { createdAt: { [Op.gte]: sevenDaysAgo } },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']]
    });
    const qualityData = await OrderItem.findAll({
      attributes: ['quality', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['quality'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 5
    });
    const statusData = await Order.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status']
    });
    res.json({ revenueData, qualityData, statusData });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({ 
      include: [
        { model: User, attributes: ['username', 'phone', 'email'] }, 
        { model: OrderItem, as: 'items' }
      ], 
      order: [['createdAt', 'DESC']] 
    });
    res.json(orders);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.put('/orders/:id/status', auth, adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Not found' });
    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.get('/qualities', async (req, res) => {
  try {
    const qualities = await Quality.findAll({ 
      include: [{ 
        model: Style, 
        include: [ProductAttribute, PriceMatrix] 
      }], 
      order: [['id', 'ASC']] 
    });
    res.json(qualities);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.post('/qualities', auth, adminAuth, upload.single('image'), async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const { name, tag, price, image_url: providedUrl } = req.body;
    let image_url = providedUrl || '';
    if (req.file) {
      image_url = `http://192.168.18.18:5000/uploads/${req.file.filename}`;
    }
    const quality = await Quality.create({ name, image_url, tag, price: price || 0 });
    res.json(quality);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.put('/qualities/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const { name, tag, price, image_url: providedUrl } = req.body;
    const quality = await Quality.findByPk(req.params.id);
    if (!quality) return res.status(404).json({ msg: 'Not found' });
    let image_url = providedUrl || quality.image_url;
    if (req.file) {
      image_url = `http://192.168.18.18:5000/uploads/${req.file.filename}`;
    }
    quality.name = name || quality.name;
    quality.tag = tag || quality.tag;
    quality.price = price || quality.price;
    quality.image_url = image_url;
    await quality.save();
    res.json(quality);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.delete('/qualities/:id', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const quality = await Quality.findByPk(req.params.id);
    if (!quality) return res.status(404).json({ msg: 'Not found' });
    await quality.destroy();
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.post('/styles', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const style = await Style.create(req.body);
    res.json(style);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.delete('/styles/:id', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    await Style.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.post('/attributes', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const attr = await ProductAttribute.create(req.body);
    res.json(attr);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.put('/attributes/:id', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const attr = await ProductAttribute.findByPk(req.params.id);
    if (!attr) return res.status(404).json({ msg: 'Not found' });
    await attr.update(req.body);
    res.json(attr);
  } catch (err) {
    res.status(500).send('Error');
  }
});

const PRICE_MATRIX_COLUMN_BY_ATTRIBUTE_TYPE = {
  category: 'categoryId',
  color: 'colorId',
  width: 'widthId',
  size: 'sizeId'
};

router.delete('/attributes/:id', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const attr = await ProductAttribute.findByPk(req.params.id);
    if (!attr) return res.status(404).json({ msg: 'Not found' });
    const column = PRICE_MATRIX_COLUMN_BY_ATTRIBUTE_TYPE[attr.type];
    if (column) {
      await PriceMatrix.destroy({ where: { [column]: attr.id } });
    }
    await attr.destroy();
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.post('/pricing/seed-dummy', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const quality = await Quality.findByPk(req.body.qualityId, { include: [{ model: Style, include: [ProductAttribute] }] });
    for (let style of quality.Styles) {
      const cats = style.ProductAttributes.filter(a => a.type === 'category');
      const cols = style.ProductAttributes.filter(a => a.type === 'color');
      const wids = style.ProductAttributes.filter(a => a.type === 'width');
      const sizes = style.ProductAttributes.filter(a => a.type === 'size');
      for (let c of cats) {
        for (let cl of cols) {
          const loopW = wids.length > 0 ? wids : [{ id: null }];
          for (let w of loopW) {
            for (let s of sizes) {
              await PriceMatrix.findOrCreate({
                where: { styleId: style.id, categoryId: c.id, colorId: cl.id, widthId: w.id, sizeId: s.id },
                defaults: { price: 0 }
              });
            }
          }
        }
      }
    }
    res.json({ msg: 'Success' });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.post('/pricing/update', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    for (let p of req.body.prices) {
      await PriceMatrix.destroy({ 
        where: { 
          styleId: req.body.styleId, 
          categoryId: req.body.categoryId, 
          colorId: req.body.colorId, 
          widthId: req.body.widthId || null, 
          sizeId: p.sizeId 
        } 
      });
      await PriceMatrix.create({
        styleId: req.body.styleId,
        categoryId: req.body.categoryId,
        colorId: req.body.colorId,
        widthId: req.body.widthId || null,
        sizeId: p.sizeId,
        price: p.price
      });
    }
    res.json({ msg: 'Success' });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.get('/staff', auth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).send('Forbidden');
  try {
    const staff = await User.findAll({ where: { role: 'admin' }, attributes: ['id', 'username', 'email', 'createdAt'] });
    res.json(staff);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.post('/staff', auth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).send('Forbidden');
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    const staff = await User.create({ ...req.body, password: hash, role: 'admin' });
    res.json({ id: staff.id, username: staff.username, email: staff.email, role: staff.role, createdAt: staff.createdAt });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.delete('/staff/:id', auth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).send('Forbidden');
  try {
    await User.destroy({ where: { id: req.params.id, role: 'admin' } });
    res.json({ msg: 'Removed' });
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({ where: { role: 'user' }, attributes: ['id', 'username', 'email', 'phone', 'createdAt'], order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).send('Error');
  }
});

router.put('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const user = await User.findOne({ where: { id: req.params.id, role: 'user' } });
    if (!user) return res.status(404).json({ msg: 'Not found' });
    user.username = username ?? user.username;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    await user.save();
    res.json({ id: user.id, username: user.username, email: user.email, phone: user.phone, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'user' } });
    if (!user) return res.status(404).json({ msg: 'Not found' });
    await user.destroy();
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

export default router;