import { query, queryOne, insert } from "./db.js";
import crypto from "crypto";

// Simple password hashing (for production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verify password
export function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

// Get user by email
export async function getUserByEmail(email) {
  const sql = "SELECT * FROM users WHERE email = ? AND role = 'admin'";
  return await queryOne(sql, [email.toLowerCase().trim()]);
}

// Generate UUID v4
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create admin user
export async function createAdminUser(email, password, name, role = "admin") {
  const { execute } = await import("./db.js");
  
  // Generate UUID for user id
  const userId = generateUUID();
  
  const sql = `
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES (?, ?, ?, ?, ?)
  `;
  const hashedPassword = hashPassword(password);
  await execute(sql, [userId, email.toLowerCase().trim(), hashedPassword, name, role]);
  return userId;
}

// Initialize default admin user if not exists
export async function initializeDefaultAdmin() {
  try {
    // Check if any admin exists
    const { query } = await import("./db.js");
    const existingAdmins = await query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const adminCount = existingAdmins[0]?.count || 0;

    // Only create default admins if no admin exists at all
    if (adminCount === 0) {
      // Create primary admin
      await createAdminUser(
        "admin@prince.com",
        "Admin@123",
        "Admin User",
        "admin"
      );
      console.log("✅ Default admin user created: admin@prince.com / Admin@123");
    } else {
      // Admins already exist, skip creation
      console.log(`ℹ️  ${adminCount} admin user(s) already exist. Skipping default admin creation.`);
    }
  } catch (error) {
    // Table might not exist yet, that's okay
    if (!error.message.includes("doesn't exist")) {
      console.error("Error initializing admin user:", error);
    }
  }
}

