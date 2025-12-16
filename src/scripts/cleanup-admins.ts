import "dotenv/config"; // Load environment variables from .env file
import { testConnection, query, execute } from "../models/db.js";

async function cleanupAdmins() {
  console.log("🧹 Cleaning up admin users...\n");

  // Test connection first
  console.log("📡 Testing database connection...");
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ Cannot connect to database. Please check your connection settings.");
    process.exit(1);
  }

  console.log("✅ Database connection successful\n");

  try {
    // Get all admin users
    console.log("📋 Fetching all admin users...");
    const admins = await query(
      "SELECT id, email, name, role, created_at FROM users WHERE role = 'admin' ORDER BY created_at ASC"
    );

    console.log(`Found ${admins.length} admin user(s):\n`);
    admins.forEach((admin: any, index: number) => {
      console.log(`${index + 1}. ${admin.email} (${admin.name}) - Created: ${admin.created_at}`);
    });

    if (admins.length <= 1) {
      console.log("\n✅ Only one admin user exists. No cleanup needed.");
      process.exit(0);
    }

    // Keep the first one (oldest) or admin@prince.com if it exists
    const keepAdmin = admins.find((a: any) => a.email === "admin@prince.com") || admins[0];
    const adminsToDelete = admins.filter((a: any) => a.id !== keepAdmin.id);

    console.log(`\n✅ Keeping: ${keepAdmin.email}`);
    console.log(`🗑️  Will delete ${adminsToDelete.length} admin user(s):\n`);

    adminsToDelete.forEach((admin: any) => {
      console.log(`   - ${admin.email} (${admin.name})`);
    });

    // Delete duplicate admins
    for (const admin of adminsToDelete) {
      console.log(`\n🗑️  Deleting ${admin.email}...`);
      await execute("DELETE FROM users WHERE id = ?", [admin.id]);
      console.log(`✅ Deleted ${admin.email}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Admin cleanup completed!");
    console.log("=".repeat(50));
    console.log(`\n✅ Kept admin: ${keepAdmin.email}`);
    console.log(`🗑️  Deleted ${adminsToDelete.length} duplicate admin(s)\n`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error cleaning up admins:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
cleanupAdmins().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

