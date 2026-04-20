const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

router.post('/place', auth, async (req, res) => {
  const { cartItems, totalAmount, paymentMethod, accountNumber, comments } = req.body;

  try {
    const order = await Order.create({
      userId: req.user.id,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      account_number: accountNumber,
      comments: comments
    });

    const items = cartItems.map(item => ({
      orderId: order.id,
      quality: item.quality,
      size: item.size,
      quantity: item.qty
    }));

    await OrderItem.bulkCreate(items);

    res.json({ msg: 'Order placed successfully', orderId: order.id });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;