import bcrypt from "bcryptjs";
import "dotenv/config";
import { sequelize } from "./config/db.js";
import User from "./models/User.js";

const EMAIL = process.argv[2] || "master@madina.com";
const PASSWORD = process.argv[3] || "master_password_123";

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const hash = await bcrypt.hash(PASSWORD, 10);
    const [user, created] = await User.findOrCreate({
      where: { email: EMAIL },
      defaults: { email: EMAIL, password: hash, role: "admin" },
    });
    if (!created) {
      user.password = hash;
      user.role = "admin";
      await user.save();
    }
    console.log(
      `${created ? "Created" : "Updated"} admin: ${EMAIL} / ${PASSWORD} (id=${user.id})`,
    );
    process.exit(0);
  } catch (err) {
    console.error("seed-admin failed:", err.message);
    process.exit(1);
  }
})();
