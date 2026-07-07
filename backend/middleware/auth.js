import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/BlacklistedToken.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    const isBlacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (isBlacklisted) {
      return res.status(401).json({ msg: "Session expired" });
    }

    // Use the configured JWT secret, or fall back to the dev secret used
    // in `routes/auth.js` to avoid verification errors during local testing.
    const jwtSecret = process.env.JWT_SECRET || "dev_secret_change_me";
    const decoded = jwt.verify(token, jwtSecret);
    if (process.env.NODE_ENV !== "production") {
      console.log("Decoded Token Data:", decoded);
    }
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    console.log("Auth Middleware Error:", err.message);
    res.status(401).json({ msg: "Session invalid" });
  }
};

export default auth;
