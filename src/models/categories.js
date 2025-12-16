import { query, queryOne, insert, execute, getConnection } from "./db.js";

// Get all categories
export async function getAllCategories() {
  const sql = "SELECT name FROM categories ORDER BY name ASC";
  const results = await query(sql);
  return results.map((r) => r.name);
}

// Generate slug from category name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Add category
export async function addCategory(category) {
  try {
    const name = category.trim();
    const slug = generateSlug(name);
    const sql = "INSERT INTO categories (name, slug) VALUES (?, ?)";
    await insert(sql, [name, slug]);
    return true;
  } catch (error) {
    // Handle duplicate entry error
    if (error.code === "ER_DUP_ENTRY") {
      return false;
    }
    throw error;
  }
}

// Update category
export async function updateCategory(oldCategory, newCategory) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // Update category name and slug
    const newSlug = generateSlug(newCategory);
    const updateCategorySql = "UPDATE categories SET name = ?, slug = ? WHERE name = ?";
    await connection.execute(updateCategorySql, [newCategory.trim(), newSlug, oldCategory.trim()]);

    // Update all products with this category
    const updateProductsSql = "UPDATE products SET category = ? WHERE category = ?";
    await connection.execute(updateProductsSql, [newCategory.trim(), oldCategory.trim()]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return false; // New category already exists
    }
    throw error;
  } finally {
    connection.release();
  }
}

// Delete category
export async function deleteCategory(category) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // Check if "Uncategorized" exists, if not create it
    const checkUncatSql = "SELECT id FROM categories WHERE name = 'Uncategorized'";
    const [uncatRows] = await connection.execute(checkUncatSql);
    if (!Array.isArray(uncatRows) || uncatRows.length === 0) {
      const uncatSlug = generateSlug("Uncategorized");
      await connection.execute("INSERT INTO categories (name, slug) VALUES (?, ?)", ["Uncategorized", uncatSlug]);
    }

    // Reassign products to "Uncategorized"
    const updateProductsSql = "UPDATE products SET category = 'Uncategorized' WHERE category = ?";
    const [updateResult] = await connection.execute(updateProductsSql, [category.trim()]);
    const reassignedCount = updateResult.affectedRows || 0;

    // Delete category
    const deleteSql = "DELETE FROM categories WHERE name = ?";
    await connection.execute(deleteSql, [category.trim()]);

    await connection.commit();
    return reassignedCount;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Check if category exists
export async function categoryExists(category) {
  const sql = "SELECT COUNT(*) as count FROM categories WHERE name = ?";
  const result = await queryOne(sql, [category.trim()]);
  return result ? result.count > 0 : false;
}

