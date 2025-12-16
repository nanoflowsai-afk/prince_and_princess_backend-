import "dotenv/config"; // Load environment variables from .env file
import { readFileSync } from "fs";
import { join } from "path";
import { query, execute, testConnection } from "../models/db.js";

// Read SQL file
const sqlFilePath = join(process.cwd(), "ecommers_Syntax.sql");
const sqlContent = readFileSync(sqlFilePath, "utf-8");

// Parse SQL statements - split by semicolons and filter out empty/comments
function parseSQLStatements(sql: string): string[] {
  // Remove single-line comments
  let cleaned = sql.replace(/--.*$/gm, "");
  
  // Split by semicolons, but be careful with multi-line statements
  const statements: string[] = [];
  let currentStatement = "";
  let inQuotes = false;
  let quoteChar = "";
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];
    
    // Handle quotes
    if ((char === '"' || char === "'" || char === "`") && cleaned[i - 1] !== "\\") {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = "";
      }
    }
    
    currentStatement += char;
    
    // If we hit a semicolon and we're not in quotes, it's the end of a statement
    if (char === ";" && !inQuotes) {
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0 && trimmed.match(/CREATE TABLE/gi)) {
        statements.push(trimmed);
      }
      currentStatement = "";
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim().length > 0 && currentStatement.match(/CREATE TABLE/gi)) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

// Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
function makeTableSafe(statement: string): string {
  // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
  let safeStatement = statement.replace(
    /CREATE TABLE\s+/gi,
    "CREATE TABLE IF NOT EXISTS "
  );

  // Handle TiDB compatibility - UUID() function might need adjustment
  // TiDB supports UUID() but let's ensure it's properly formatted
  safeStatement = safeStatement.replace(
    /DEFAULT\s*\(UUID\(\)\)/gi,
    "DEFAULT (UUID())"
  );

  return safeStatement;
}

// Execute migration
async function runMigration() {
  console.log("🚀 Starting database migration...\n");

  // Test connection first
  console.log("📡 Testing database connection...");
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ Cannot connect to database. Please check your connection settings.");
    process.exit(1);
  }

  console.log("✅ Database connection successful\n");

  // Parse SQL statements
  console.log("📖 Parsing SQL file...");
  const statements = parseSQLStatements(sqlContent);
  console.log(`📋 Found ${statements.length} SQL statements\n`);

  // Execute each statement
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip if it's not a CREATE TABLE statement
    if (!statement.match(/CREATE TABLE/gi)) {
      continue;
    }

    const safeStatement = makeTableSafe(statement);
    
    // Extract table name for logging (handle backticks, quotes, and plain names)
    const tableMatch = safeStatement.match(/CREATE TABLE IF NOT EXISTS\s+[`"']?(\w+)[`"']?/i);
    const tableName = tableMatch ? tableMatch[1] : `statement_${i + 1}`;

    try {
      console.log(`⏳ Creating table: ${tableName}...`);
      await execute(safeStatement);
      console.log(`✅ Table '${tableName}' created successfully\n`);
      successCount++;
    } catch (error: any) {
      // Check if table already exists
      if (
        error.code === "ER_TABLE_EXISTS_ERROR" ||
        error.message?.includes("already exists") ||
        error.message?.includes("Duplicate table")
      ) {
        console.log(`ℹ️  Table '${tableName}' already exists, skipping...\n`);
        successCount++;
      } else {
        console.error(`❌ Error creating table '${tableName}':`, error.message);
        console.error(`   SQL: ${safeStatement.substring(0, 100)}...\n`);
        errorCount++;
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Migration Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}`);
  console.log("=".repeat(50) + "\n");

  if (errorCount > 0) {
    console.log("⚠️  Some tables failed to create. Please review the errors above.");
    process.exit(1);
  } else {
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  }
}

// Run migration
runMigration().catch((error) => {
  console.error("💥 Fatal error during migration:", error);
  process.exit(1);
});

