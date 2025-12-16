import mysql from "mysql2/promise";

// MySQL Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Nano@123",
  database: process.env.DB_NAME || "prince",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // SSL configuration for secure connections (required for TiDB Cloud)
  ssl: {
    rejectUnauthorized: false, // Set to false for TiDB Cloud self-signed certificates
  },
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ MySQL database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MySQL database connection failed:", error);
    return false;
  }
}

// Execute query helper
export async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Execute single row query
export async function queryOne(sql, params) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Execute insert and return insertId
export async function insert(sql, params) {
  try {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  } catch (error) {
    console.error("Database insert error:", error);
    throw error;
  }
}

// Execute update/delete and return affected rows
export async function execute(sql, params) {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    console.error("Database execute error:", error);
    throw error;
  }
}

// Get connection from pool (for transactions)
export async function getConnection() {
  return await pool.getConnection();
}

// Close pool (call on app shutdown)
export async function closePool() {
  await pool.end();
}

export default pool;