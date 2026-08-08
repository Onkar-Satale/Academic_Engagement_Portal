import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  host: (process.env.DB_HOST || "localhost").trim(),
  user: (process.env.DB_USER || "root").trim(),
  password: (process.env.DB_PASSWORD || "").trim(),
  database: (process.env.DB_NAME || "college_db").trim(),
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_SSL === "true" && { ssl: { rejectUnauthorized: false } })
});

export default db;
