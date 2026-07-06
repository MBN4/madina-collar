import dotenv from "dotenv";
import path from "path";
import { Sequelize } from "sequelize";
import { fileURLToPath } from "url";

// Load .env located in the backend folder (works when starting server from repo root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Support DATABASE_URL (preferred) or individual DB_* env vars with sensible defaults
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
  });
} else {
  const dbName = process.env.DB_NAME || "madina";
  const dbUser = process.env.DB_USER || "postgres";
  const dbPass = process.env.DB_PASS || "postgres";
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: "postgres",
    logging: false,
  });
}

export { sequelize };

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected...");
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message || err);
    console.error("  - DB host:", process.env.DB_HOST || "127.0.0.1");
    console.error("  - DB user:", process.env.DB_USER || "postgres");
    console.error("  - Using DATABASE_URL:", !!process.env.DATABASE_URL);
    // Do not abruptly exit here to allow dev tooling to surface full error context.
    // Exiting was causing the whole process to stop without clear actionable next steps.
    process.exitCode = 1;
  }
};
