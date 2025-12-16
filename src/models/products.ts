import { query, queryOne, insert, execute } from "./db";

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  description?: string | null;
  type?: string | null;
  gender?: string | null;
  image: string;
  hover_image?: string | null;
  size_stock?: Record<string, number> | null; // JSON: {"16": 5, "18": 0}
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  description?: string | null;
  type?: string | null;
  gender?: string | null;
  image: string;
  hover_image?: string | null;
  size_stock?: Record<string, number> | null;
}

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  const sql = "SELECT * FROM products ORDER BY created_at DESC";
  const products = await query<any>(sql);
  // Parse size_stock JSON if it exists
  return products.map((p: any) => ({
    ...p,
    size_stock: p.size_stock ? (typeof p.size_stock === 'string' ? JSON.parse(p.size_stock) : p.size_stock) : null
  }));
}

// Get product by ID
export async function getProductById(id: number): Promise<Product | null> {
  const sql = "SELECT * FROM products WHERE id = ?";
  const product = await queryOne<any>(sql, [id]);
  if (!product) return null;
  // Parse size_stock JSON if it exists
  return {
    ...product,
    size_stock: product.size_stock ? (typeof product.size_stock === 'string' ? JSON.parse(product.size_stock) : product.size_stock) : null
  };
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const sql = "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC";
  return await query<Product>(sql, [category]);
}

// Add new product
export async function addProduct(product: ProductInput): Promise<number> {
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
export async function updateProduct(
  id: number,
  updates: Partial<ProductInput>
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

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
export async function deleteProduct(id: number): Promise<boolean> {
  const sql = "DELETE FROM products WHERE id = ?";
  const affectedRows = await execute(sql, [id]);
  return affectedRows > 0;
}

