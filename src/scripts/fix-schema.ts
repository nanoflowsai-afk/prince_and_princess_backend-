import "dotenv/config"; // Load environment variables from .env file
import { testConnection, execute, queryOne } from "../models/db.js";

async function fixSchema() {
  console.log("🔧 Fixing database schema...\n");

  // Test connection first
  console.log("📡 Testing database connection...");
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ Cannot connect to database. Please check your connection settings.");
    process.exit(1);
  }

  console.log("✅ Database connection successful\n");

  try {
    // 1. Add missing columns to cart_items table
    console.log("📋 Checking cart_items table structure...");
    
    // Check if session_id column exists
    const checkSessionId = await queryOne(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart_items' AND column_name = 'session_id'"
    );
    
    if (!checkSessionId || (checkSessionId as any).count === 0) {
      console.log("➕ Adding session_id column to cart_items...");
      await execute("ALTER TABLE cart_items ADD COLUMN session_id VARCHAR(255) NULL AFTER user_id");
      console.log("✅ Added session_id column\n");
    } else {
      console.log("✅ session_id column already exists\n");
    }

    // Check if customer_id column exists
    const checkCustomerId = await queryOne(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart_items' AND column_name = 'customer_id'"
    );
    
    if (!checkCustomerId || (checkCustomerId as any).count === 0) {
      console.log("➕ Adding customer_id column to cart_items...");
      await execute("ALTER TABLE cart_items ADD COLUMN customer_id INT NULL AFTER session_id");
      console.log("✅ Added customer_id column\n");
    } else {
      console.log("✅ customer_id column already exists\n");
    }

    // Check if size column exists
    const checkSize = await queryOne(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart_items' AND column_name = 'size'"
    );
    
    if (!checkSize || (checkSize as any).count === 0) {
      console.log("➕ Adding size column to cart_items...");
      await execute("ALTER TABLE cart_items ADD COLUMN size VARCHAR(50) NULL AFTER quantity");
      console.log("✅ Added size column\n");
    } else {
      console.log("✅ size column already exists\n");
    }

    // Check if color column exists
    const checkColor = await queryOne(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart_items' AND column_name = 'color'"
    );
    
    if (!checkColor || (checkColor as any).count === 0) {
      console.log("➕ Adding color column to cart_items...");
      await execute("ALTER TABLE cart_items ADD COLUMN color VARCHAR(50) NULL AFTER size");
      console.log("✅ Added color column\n");
    } else {
      console.log("✅ color column already exists\n");
    }

    // Make user_id nullable if it's not already
    console.log("🔍 Checking if user_id is nullable...");
    const userIdNullable = await queryOne(
      "SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart_items' AND column_name = 'user_id'"
    );
    
    if (userIdNullable && (userIdNullable as any).IS_NULLABLE === 'NO') {
      console.log("➕ Making user_id nullable...");
      await execute("ALTER TABLE cart_items MODIFY COLUMN user_id VARCHAR(36) NULL");
      console.log("✅ Made user_id nullable\n");
    } else {
      console.log("✅ user_id is already nullable\n");
    }

    // 2. Create slides table if it doesn't exist
    console.log("📋 Checking if slides table exists...");
    try {
      await queryOne("SELECT 1 FROM slides LIMIT 1");
      console.log("✅ Slides table already exists\n");
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.code === "ER_NO_SUCH_TABLE") {
        console.log("➕ Creating slides table...");
        await execute(`
          CREATE TABLE IF NOT EXISTS slides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            image TEXT NOT NULL,
            date DATE,
            category VARCHAR(100),
            type ENUM('special', 'normal') NOT NULL DEFAULT 'normal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log("✅ Slides table created\n");
      } else {
        throw error;
      }
    }

    console.log("=".repeat(50));
    console.log("🎉 Schema fixes completed successfully!");
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error fixing schema:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
fixSchema().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

