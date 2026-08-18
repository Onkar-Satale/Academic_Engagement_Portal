import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const db = mysql.createPool({
  host: (process.env.DB_HOST).trim(),
  user: (process.env.DB_USER).trim(),
  password: (process.env.DB_PASSWORD).trim(),
  database: (process.env.DB_NAME).trim(),
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_SSL === "true" && { ssl: { rejectUnauthorized: false } })
});
