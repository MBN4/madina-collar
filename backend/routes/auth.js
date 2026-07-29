import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import BlacklistedToken from "../models/BlacklistedToken.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, phone, password } = req.body;
  try {
    if (!username || !phone || !password)
      return res.status(400).json({ msg: "All fields are required" });
    const existing = await User.findOne({ where: { phone } });
    if (existing)
      return res.status(400).json({ msg: "Phone number already registered" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      username,
      phone,
      password: hashedPassword,
      role: "user",
    });
    res.json({ msg: "Registration complete!", userId: newUser.id });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.post("/admin/register", async (req, res) => {
  const { email, password, adminSecret } = req.body;
  try {
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ msg: "Invalid Admin Secret Key" });
    }
    let user = await User.findOne({ where: { email } });
    if (user)
      return res
        .status(400)
        .json({ msg: "Admin with this email already exists" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      role: "admin",
    });
    res.json({ msg: "Admin created successfully", id: newAdmin.id });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.post("/admin/forgot-password", async (req, res) => {
  const { email, adminSecret, newPassword } = req.body;
  try {
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ msg: "Invalid Admin Secret Key" });
    }
    const user = await User.findOne({ where: { email, role: "admin" } });
    if (!user) return res.status(404).json({ msg: "Admin account not found" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  const { phone, email, password } = req.body;
  try {
    const user = await User.findOne({
      where: email ? { email } : { phone },
    });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const jwtSecret = process.env.JWT_SECRET || "dev_secret_change_me";
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Auth login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await BlacklistedToken.create({ token: req.token, expires_at: expiresAt });
    res.json({ msg: "Successfully logged out" });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

export default router;