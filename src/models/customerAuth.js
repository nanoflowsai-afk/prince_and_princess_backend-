import { query, queryOne, insert } from "./db.js";
import crypto from "crypto";

// Simple password hashing
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verify password
export function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

// Initialize customers table if it doesn't exist
export async function initializeCustomersTable() {
  try {
    const { execute } = await import("./db.js");
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await execute(createTableSQL);
    console.log("✅ Customers table initialized");
  } catch (error) {
    // Table might already exist or there's a connection issue
    if (error.message.includes("doesn't exist") || error.message.includes("ER_TABLE_EXISTS_ERROR")) {
      console.log("ℹ️  Customers table already exists or being created");
    } else {
      console.error("⚠️  Error initializing customers table:", error.message);
    }
    // Don't throw - allow the app to continue
  }
}

// Get customer by email
export async function getCustomerByEmail(email) {
  const sql = "SELECT * FROM customers WHERE email = ?";
  return await queryOne(sql, [email.toLowerCase().trim()]);
}

// Get customer by ID
export async function getCustomerById(id) {
  const sql = "SELECT * FROM customers WHERE id = ?";
  return await queryOne(sql, [id]);
}

// Create customer
export async function createCustomer(email, password, name, phone) {
  const sql = `
    INSERT INTO customers (email, password, name, phone)
    VALUES (?, ?, ?, ?)
  `;
  const hashedPassword = hashPassword(password);
  return await insert(sql, [email.toLowerCase().trim(), hashedPassword, name, phone || null]);
}

