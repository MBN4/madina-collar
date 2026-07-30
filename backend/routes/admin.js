import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { Sequelize, Op } from 'sequelize';
import { sequelize } from '../config/db.js';
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
    // Realized revenue: only DELIVERED orders, plotted by their delivery date,
    // over the last 30 days.
    const WINDOW_DAYS = 30;
    const windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1));
    const rawRevenueData = await Order.findAll({
      attributes: [[Sequelize.fn('DATE', Sequelize.col('deliveredAt')), 'date'], [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'revenue']],
      where: { status: 'delivered', deliveredAt: { [Op.gte]: windowStart } },
      group: [Sequelize.fn('DATE', Sequelize.col('deliveredAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('deliveredAt')), 'ASC']]
    });
    const revenueByDate = new Map(rawRevenueData.map(r => [r.get('date'), Number(r.get('revenue'))]));
    const revenueData = [];
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      revenueData.push({ date: dateStr, revenue: revenueByDate.get(dateStr) || 0 });
    }
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
    // Track when the order was delivered so revenue can be plotted by delivery
    // date. Preserve an existing delivery date; clear it if it leaves 'delivered'.
    if (status === 'delivered') {
      order.deliveredAt = order.deliveredAt || new Date();
    } else {
      order.deliveredAt = null;
    }
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
      image_url = `https://api.almadina.site/uploads/${req.file.filename}`;
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
      image_url = `https://api.almadina.site/uploads/${req.file.filename}`;
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

router.put('/styles/:id', auth, adminAuth, async (req, res) => {
  if (!isMaster(req)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const style = await Style.findByPk(req.params.id);
    if (!style) return res.status(404).json({ msg: 'Not found' });
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      style.name = req.body.name.trim();
      await style.save();
    }
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
  const { styleId, categoryId, colorId, widthId, prices } = req.body;

  // FIX 4: fail fast with a clear error rather than 500ing mid-loop after
  // some rows have already been destroyed. PriceMatrix requires styleId +
  // categoryId + colorId + sizeId; widthId is optional.
  if (styleId == null || categoryId == null || colorId == null) {
    return res.status(400).json({ msg: 'styleId, categoryId and colorId are required' });
  }
  if (!Array.isArray(prices) || prices.length === 0) {
    return res.status(400).json({ msg: 'prices must be a non-empty array' });
  }

  // FIX 2: wrap the entire write in a single transaction so a mid-loop
  // failure rolls back every prior change. Also switch from destroy+create
  // to an upsert-style find-then-update-or-create so we never leave the DB
  // in a half-deleted state even without the transaction guard.
  const t = await sequelize.transaction();
  try {
    for (const p of prices) {
      if (p == null || p.sizeId == null) continue;
      const priceValue = Math.max(0, Number(p.price) || 0);
      const where = {
        styleId,
        categoryId,
        colorId,
        widthId: widthId || null,
        sizeId: p.sizeId,
      };
      const existing = await PriceMatrix.findOne({ where, transaction: t });
      if (existing) {
        existing.price = priceValue;
        await existing.save({ transaction: t });
      } else {
        await PriceMatrix.create({ ...where, price: priceValue }, { transaction: t });
      }
    }
    await t.commit();
    res.json({ msg: 'Success' });
  } catch (err) {
    await t.rollback();
    console.error('pricing/update failed:', err);
    res.status(500).json({ msg: 'Update failed' });
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