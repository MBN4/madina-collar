import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';

const router = express.Router();

router.post('/place', auth, async (req, res) => {
  const { cartItems, totalAmount, paymentMethod, biltiInfo } = req.body;
  try {
    const order = await Order.create({
      userId: req.user.id,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      bilti_info: biltiInfo,
      status: 'pending'
    });

    const items = cartItems.map(item => ({
      orderId: order.id,
      quality: item.quality,
      style: item.style,
      category: item.category,
      color: item.color,
      width: item.width,
      size: item.size,
      quantity: item.qty,
      price_at_purchase: item.price
    }));

    await OrderItem.bulkCreate(items);
    res.json({ msg: 'Success', orderId: order.id });
  } catch (err) {
    res.status(500).json({ msg: 'Error' });
  }
});

router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).send('Error');
  }
});

export default router;