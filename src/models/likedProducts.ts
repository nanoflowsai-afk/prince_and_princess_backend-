import { query, queryOne, insert, execute } from "./db";

export interface LikedProduct {
  id: number;
  customer_id: number;
  product_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// Get all liked products for a customer
export async function getLikedProductsByCustomerId(customerId: number): Promise<LikedProduct[]> {
  const sql = "SELECT * FROM liked_products WHERE customer_id = ? ORDER BY created_at DESC";
  return await query<LikedProduct>(sql, [customerId]);
}

// Check if product is liked by customer
export async function isProductLiked(customerId: number, productId: number): Promise<boolean> {
  const sql = "SELECT id FROM liked_products WHERE customer_id = ? AND product_id = ? LIMIT 1";
  const result = await queryOne<{ id: number }>(sql, [customerId, productId]);
  return result !== null;
}

// Add product to liked list
export async function addLikedProduct(customerId: number, productId: number): Promise<number> {
  // Check if already liked
  const existing = await isProductLiked(customerId, productId);
  if (existing) {
    throw new Error("Product is already in your wishlist");
  }

  const sql = "INSERT INTO liked_products (customer_id, product_id) VALUES (?, ?)";
  return await insert(sql, [customerId, productId]);
}

// Remove product from liked list
export async function removeLikedProduct(customerId: number, productId: number): Promise<boolean> {
  const sql = "DELETE FROM liked_products WHERE customer_id = ? AND product_id = ?";
  const affected = await execute(sql, [customerId, productId]);
  return affected > 0;
}

// Toggle liked product (like/unlike)
export async function toggleLikedProduct(customerId: number, productId: number): Promise<boolean> {
  const isLiked = await isProductLiked(customerId, productId);
  if (isLiked) {
    await removeLikedProduct(customerId, productId);
    return false; // Now unliked
  } else {
    await addLikedProduct(customerId, productId);
    return true; // Now liked
  }
}

