import { query, queryOne, insert } from "./db";
import crypto from "crypto";

export interface AdminUser {
  id: string; // UUID
  email: string;
  password_hash: string; // hashed password
  name: string;
  role: string;
  phone?: string;
  address?: string;
  avatar?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Simple password hashing (for production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verify password (works with both password_hash and password fields)
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  const sql = "SELECT * FROM users WHERE email = ? AND role = 'admin'";
  return await queryOne<AdminUser>(sql, [email.toLowerCase().trim()]);
}

// Generate UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create admin user
export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  role: string = "admin"
): Promise<string> {
  const { execute } = await import("./db");
  
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
export async function initializeDefaultAdmin(): Promise<void> {
  try {
    // Check if any admin exists
    const { query } = await import("./db");
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
  } catch (error: any) {
    // Table might not exist yet, that's okay
    if (!error.message.includes("doesn't exist")) {
      console.error("Error initializing admin user:", error);
    }
  }
}

