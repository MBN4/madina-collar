const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');

router.post('/register/step1', async (req, res) => {
  const { username, phone } = req.body;
  try {
    let user = await User.findOne({ where: { phone } });
    if (user) return res.status(400).json({ msg: 'Phone number already registered' });

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await Otp.create({ phone, otp_code: otpCode, expires_at: expiresAt });
    console.log(`📱 OTP for ${phone}: ${otpCode}`);

    res.json({ msg: 'OTP sent to WhatsApp' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/register/step2', async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const record = await Otp.findOne({ 
      where: { phone, otp_code: otp, is_verified: false },
      order: [['createdAt', 'DESC']]
    });
    if (!record) return res.status(400).json({ msg: 'Invalid OTP' });
    if (new Date() > record.expires_at) return res.status(400).json({ msg: 'OTP has expired' });

    record.is_verified = true;
    await record.save();
    res.json({ msg: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/register/step3', async (req, res) => {
  const { username, phone, password } = req.body;
  try {
    const isVerified = await Otp.findOne({ where: { phone, is_verified: true } });
    if (!isVerified) return res.status(400).json({ msg: 'Please verify OTP first' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      phone,
      password: hashedPassword
    });

    res.json({ msg: 'Registration complete!', userId: newUser.id });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, phone: user.phone } });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;