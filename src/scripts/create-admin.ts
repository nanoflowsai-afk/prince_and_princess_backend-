import "dotenv/config"; // Load environment variables from .env file
import { testConnection, execute, queryOne } from "../models/db.js";
import crypto from "crypto";

// Hash password using SHA256 (matching the auth.ts implementation)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
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
async function createAdminUser() {
  console.log("🚀 Creating admin user...\n");

  // Test connection first
  console.log("📡 Testing database connection...");
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ Cannot connect to database. Please check your connection settings.");
    process.exit(1);
  }

  console.log("✅ Database connection successful\n");

  // Default admin credentials
  const adminEmail = "admin@prince.com";
  const adminPassword = "Admin@123";
  const adminName = "Admin User";

  try {
    // Check if users table exists by trying to query it
    console.log("📋 Checking if users table exists...");
    try {
      await queryOne("SELECT 1 FROM users LIMIT 1");
      console.log("✅ Users table exists\n");
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.code === "ER_NO_SUCH_TABLE") {
        console.error("❌ Users table does not exist. Please run 'npm run migrate' first to create all tables.");
        process.exit(1);
      }
      throw error;
    }

    console.log("✅ Users table exists\n");

    // Check if admin user already exists
    console.log(`🔍 Checking if admin user exists (${adminEmail})...`);
    const existingUser = await queryOne(
      "SELECT * FROM users WHERE email = ?",
      [adminEmail.toLowerCase().trim()]
    );

    if (existingUser) {
      console.log("ℹ️  Admin user already exists!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${(existingUser as any).name || adminName}`);
      console.log(`   Role: ${(existingUser as any).role || "admin"}`);
      console.log("\n✅ Admin user is ready to use!");
      console.log("\n📝 Login Credentials:");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      process.exit(0);
    }

    // Create admin user
    console.log("👤 Creating admin user...");
    const userId = generateUUID();
    const hashedPassword = hashPassword(adminPassword);

    const insertSQL = `
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    await execute(insertSQL, [
      userId,
      adminEmail.toLowerCase().trim(),
      adminName,
      hashedPassword,
      "admin",
    ]);

    console.log("✅ Admin user created successfully!\n");

    // Display credentials
    console.log("=".repeat(50));
    console.log("🎉 Admin User Created Successfully!");
    console.log("=".repeat(50));
    console.log("\n📝 Login Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Name: ${adminName}`);
    console.log(`   Role: admin`);
    console.log("\n⚠️  Please save these credentials securely!");
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    
    // Check if it's a duplicate entry error
    if (error.code === "ER_DUP_ENTRY" || error.message?.includes("Duplicate entry")) {
      console.log("\nℹ️  Admin user might already exist. Checking...");
      const existingUser = await queryOne(
        "SELECT * FROM users WHERE email = ?",
        [adminEmail.toLowerCase().trim()]
      );
      if (existingUser) {
        console.log("\n✅ Admin user found!");
        console.log("\n📝 Login Credentials:");
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
      }
    }
    
    process.exit(1);
  }
}

// Run the script
createAdminUser().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

