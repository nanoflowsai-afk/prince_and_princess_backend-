import "dotenv/config"; // Load environment variables from .env file
import { testConnection, execute, queryOne } from "../models/db.js";

async function syncSchema() {
  console.log("🔄 Syncing database schema with schema file...\n");

  // Test connection first
  console.log("📡 Testing database connection...");
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ Cannot connect to database. Please check your connection settings.");
    process.exit(1);
  }

  console.log("✅ Database connection successful\n");

  try {
    // 1. Create transactions table if it doesn't exist
    console.log("📋 Checking transactions table...");
    try {
      await queryOne("SELECT 1 FROM transactions LIMIT 1");
      console.log("✅ Transactions table already exists\n");
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.code === "ER_NO_SUCH_TABLE") {
        console.log("➕ Creating transactions table...");
        await execute(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_id VARCHAR(100) NOT NULL UNIQUE,
            user_id INT NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log("✅ Transactions table created\n");
      } else {
        throw error;
      }
    }

    // 2. Create settings table if it doesn't exist
    console.log("📋 Checking settings table...");
    try {
      await queryOne("SELECT 1 FROM settings LIMIT 1");
      console.log("✅ Settings table already exists\n");
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.code === "ER_NO_SUCH_TABLE") {
        console.log("➕ Creating settings table...");
        await execute(`
          CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log("✅ Settings table created\n");
      } else {
        throw error;
      }
    }

    // 3. Check and update orders table structure
    console.log("📋 Checking orders table structure...");
    try {
      // Check if orders table exists
      await queryOne("SELECT 1 FROM orders LIMIT 1");
      
      // Check for missing columns in orders table
      const checkColumns = async (columnName: string): Promise<boolean> => {
        try {
          const result = await queryOne(
            `SELECT COUNT(*) as count FROM information_schema.columns 
             WHERE table_schema = DATABASE() 
             AND table_name = 'orders' 
             AND column_name = ?`,
            [columnName]
          );
          return result && (result as any).count > 0;
        } catch {
          return false;
        }
      };

      // Add missing columns to orders table (without AFTER clause to avoid dependency issues)
      const columnsToAdd = [
        { name: "order_id", type: "VARCHAR(100)", unique: true },
        { name: "razorpay_order_id", type: "VARCHAR(255)" },
        { name: "razorpay_payment_id", type: "VARCHAR(255)" },
        { name: "razorpay_signature", type: "VARCHAR(255)" },
        { name: "customer_name", type: "VARCHAR(255)" },
        { name: "customer_email", type: "VARCHAR(255)" },
        { name: "customer_phone", type: "VARCHAR(50)" },
        { name: "shipping_address", type: "TEXT" },
        { name: "shipping_city", type: "VARCHAR(100)" },
        { name: "shipping_state", type: "VARCHAR(100)" },
        { name: "shipping_zip", type: "VARCHAR(20)" },
        { name: "shipping_country", type: "VARCHAR(100) DEFAULT 'India'" },
        { name: "items", type: "JSON" },
        { name: "subtotal", type: "DECIMAL(10,2)" },
        { name: "shipping", type: "DECIMAL(10,2) DEFAULT '0'" },
        { name: "tax", type: "DECIMAL(10,2) DEFAULT '0'" },
        { name: "total", type: "DECIMAL(10,2)" },
        { name: "status", type: "ENUM('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'failed') DEFAULT 'pending'" },
        { name: "payment_status", type: "ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending'" },
      ];

      let addedColumns = 0;
      for (const col of columnsToAdd) {
        const exists = await checkColumns(col.name);
        if (!exists) {
          console.log(`➕ Adding ${col.name} column to orders table...`);
          try {
            // Add column without UNIQUE constraint first
            let columnDef = col.type;
            if (col.unique) {
              // Remove UNIQUE from type and add it separately if needed
              columnDef = col.type.replace(" UNIQUE", "");
            }
            await execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${columnDef}`);
            
            // Add UNIQUE constraint separately if needed
            if (col.unique) {
              try {
                await execute(`ALTER TABLE orders ADD UNIQUE KEY unique_${col.name} (${col.name})`);
              } catch (uniqueError: any) {
                // UNIQUE constraint might already exist or not be supported
                console.log(`   (Note: UNIQUE constraint for ${col.name} may need manual setup)`);
              }
            }
            
            console.log(`✅ Added ${col.name} column`);
            addedColumns++;
          } catch (alterError: any) {
            // Column might already exist or there's a constraint issue
            if (!alterError.message?.includes("Duplicate column")) {
              console.log(`⚠️  Could not add ${col.name}: ${alterError.message}`);
            }
          }
        }
      }

      if (addedColumns > 0) {
        console.log(`✅ Added ${addedColumns} columns to orders table\n`);
      } else {
        console.log("✅ Orders table structure is up to date\n");
      }
    } catch (error: any) {
      if (error.message?.includes("doesn't exist") || error.code === "ER_NO_SUCH_TABLE") {
        console.log("⚠️  Orders table doesn't exist. It should be created by the migration script.\n");
      } else {
        console.log(`⚠️  Could not check orders table: ${error.message}\n`);
      }
    }

    // 4. Check and update products table for missing columns
    console.log("📋 Checking products table structure...");
    try {
      const checkProductColumn = async (columnName: string): Promise<boolean> => {
        try {
          const result = await queryOne(
            `SELECT COUNT(*) as count FROM information_schema.columns 
             WHERE table_schema = DATABASE() 
             AND table_name = 'products' 
             AND column_name = ?`,
            [columnName]
          );
          return result && (result as any).count > 0;
        } catch {
          return false;
        }
      };

      const productColumns = [
        { name: "name", type: "VARCHAR(255)", after: "id" },
        { name: "size_stock", type: "JSON", after: null }, // Will add at end if size doesn't exist
        { name: "hover_image", type: "TEXT", after: "image" },
      ];

      let addedProductColumns = 0;
      for (const col of productColumns) {
        const exists = await checkProductColumn(col.name);
        if (!exists) {
          console.log(`➕ Adding ${col.name} column to products table...`);
          try {
            let afterClause = "";
            if (col.after) {
              // Check if the 'after' column exists
              const afterExists = await checkProductColumn(col.after);
              if (afterExists) {
                afterClause = ` AFTER ${col.after}`;
              }
            }
            
            await execute(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}${afterClause}`);
            console.log(`✅ Added ${col.name} column`);
            addedProductColumns++;
          } catch (alterError: any) {
            if (!alterError.message?.includes("Duplicate column")) {
              console.log(`⚠️  Could not add ${col.name}: ${alterError.message}`);
            }
          }
        }
      }

      if (addedProductColumns > 0) {
        console.log(`✅ Added ${addedProductColumns} columns to products table\n`);
      } else {
        console.log("✅ Products table structure is up to date\n");
      }
    } catch (error: any) {
      console.log(`⚠️  Could not check products table: ${error.message}\n`);
    }

    console.log("=".repeat(50));
    console.log("🎉 Schema sync completed successfully!");
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error syncing schema:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
syncSchema().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

