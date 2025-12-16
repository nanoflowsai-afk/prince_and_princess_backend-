import { query, queryOne, insert } from "./db";
import crypto from "crypto";

export interface Customer {
  id: number;
  email: string;
  password: string; // hashed
  name: string;
  phone?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// Simple password hashing
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verify password
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Initialize customers table if it doesn't exist
export async function initializeCustomersTable(): Promise<void> {
  try {
    const { execute } = await import("./db");
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
  } catch (error: any) {
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
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const sql = "SELECT * FROM customers WHERE email = ?";
  return await queryOne<Customer>(sql, [email.toLowerCase().trim()]);
}

// Get customer by ID
export async function getCustomerById(id: number): Promise<Customer | null> {
  const sql = "SELECT * FROM customers WHERE id = ?";
  return await queryOne<Customer>(sql, [id]);
}

// Create customer
export async function createCustomer(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<number> {
  const sql = `
    INSERT INTO customers (email, password, name, phone)
    VALUES (?, ?, ?, ?)
  `;
  const hashedPassword = hashPassword(password);
  return await insert(sql, [email.toLowerCase().trim(), hashedPassword, name, phone || null]);
}

