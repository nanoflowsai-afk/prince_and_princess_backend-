import { query, queryOne, insert, execute } from "./db.js";

// Get all products
export async function getAllProducts() {
  const sql = "SELECT * FROM products ORDER BY created_at DESC";
  const products = await query(sql);
  // Parse size_stock JSON if it exists
  return products.map((p) => ({
    ...p,
    size_stock: p.size_stock ? (typeof p.size_stock === 'string' ? JSON.parse(p.size_stock) : p.size_stock) : null
  }));
}

// Get product by ID
export async function getProductById(id) {
  const sql = "SELECT * FROM products WHERE id = ?";
  const product = await queryOne(sql, [id]);
  if (!product) return null;
  // Parse size_stock JSON if it exists
  return {
    ...product,
    size_stock: product.size_stock ? (typeof product.size_stock === 'string' ? JSON.parse(product.size_stock) : product.size_stock) : null
  };
}

// Get products by category
export async function getProductsByCategory(category) {
  const sql = "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC";
  return await query(sql, [category]);
}

// Add new product
export async function addProduct(product) {
  const sql = `
    INSERT INTO products (name, category, price, quantity, size, size_stock, color, description, type, gender, image, hover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return await insert(sql, [
    product.name,
    product.category,
    product.price,
    product.quantity,
    product.size || null,
    product.size_stock ? JSON.stringify(product.size_stock) : null,
    product.color || null,
    product.description || null,
    product.type || null,
    product.gender || null,
    product.image,
    product.hover_image || null,
  ]);
}

// Update product
export async function updateProduct(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.price !== undefined) {
    fields.push("price = ?");
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(updates.quantity);
  }
  if (updates.size !== undefined) {
    fields.push("size = ?");
    values.push(updates.size);
  }
  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.type !== undefined) {
    fields.push("type = ?");
    values.push(updates.type);
  }
  if (updates.gender !== undefined) {
    fields.push("gender = ?");
    values.push(updates.gender);
  }
  if (updates.image !== undefined) {
    fields.push("image = ?");
    values.push(updates.image);
  }
  if (updates.hover_image !== undefined) {
    fields.push("hover_image = ?");
    values.push(updates.hover_image);
  }
  if (updates.size_stock !== undefined) {
    fields.push("size_stock = ?");
    values.push(updates.size_stock ? JSON.stringify(updates.size_stock) : null);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const sql = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;
  const affectedRows = await execute(sql, values);
  return affectedRows > 0;
}

// Delete product
export async function deleteProduct(id) {
  const sql = "DELETE FROM products WHERE id = ?";
  const affectedRows = await execute(sql, [id]);
  return affectedRows > 0;
}

