import { query, queryOne, insert, execute } from "./db.js";

// Get all liked products for a customer
export async function getLikedProductsByCustomerId(customerId) {
  const sql = "SELECT * FROM liked_products WHERE customer_id = ? ORDER BY created_at DESC";
  return await query(sql, [customerId]);
}

// Check if product is liked by customer
export async function isProductLiked(customerId, productId) {
  const sql = "SELECT id FROM liked_products WHERE customer_id = ? AND product_id = ? LIMIT 1";
  const result = await queryOne(sql, [customerId, productId]);
  return result !== null;
}

// Add product to liked list
export async function addLikedProduct(customerId, productId) {
  // Check if already liked
  const existing = await isProductLiked(customerId, productId);
  if (existing) {
    throw new Error("Product is already in your wishlist");
  }

  const sql = "INSERT INTO liked_products (customer_id, product_id) VALUES (?, ?)";
  return await insert(sql, [customerId, productId]);
}

// Remove product from liked list
export async function removeLikedProduct(customerId, productId) {
  const sql = "DELETE FROM liked_products WHERE customer_id = ? AND product_id = ?";
  const affected = await execute(sql, [customerId, productId]);
  return affected > 0;
}

// Toggle liked product (like/unlike)
export async function toggleLikedProduct(customerId, productId) {
  const isLiked = await isProductLiked(customerId, productId);
  if (isLiked) {
    await removeLikedProduct(customerId, productId);
    return false; // Now unliked
  } else {
    await addLikedProduct(customerId, productId);
    return true; // Now liked
  }
}

