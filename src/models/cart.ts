import { query, queryOne, insert, execute } from "./db";

export interface CartItem {
  id: number;
  customer_id: number | null;
  user_id: number | null;
  session_id: string | null;
  product_id: number;
  quantity: number;
  size: string | null;
  color: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CartItemInput {
  customer_id?: number;
  session_id?: string;
  product_id: number;
  quantity: number;
  size?: string;
  color?: string;
}

// Get all cart items for a customer
export async function getCartItemsByCustomerId(customerId: number): Promise<CartItem[]> {
  const sql = "SELECT * FROM cart_items WHERE customer_id = ? ORDER BY created_at DESC";
  return await query<CartItem>(sql, [customerId]);
}

// Get all cart items for a session (guest cart)
export async function getCartItemsBySessionId(sessionId: string): Promise<CartItem[]> {
  const sql = "SELECT * FROM cart_items WHERE session_id = ? ORDER BY created_at DESC";
  return await query<CartItem>(sql, [sessionId]);
}

// Get cart item by ID
export async function getCartItemById(id: number): Promise<CartItem | null> {
  const sql = "SELECT * FROM cart_items WHERE id = ?";
  return await queryOne<CartItem>(sql, [id]);
}

// Check if cart item exists (same product, size, color for customer or session)
export async function findExistingCartItem(
  customerId: number | undefined,
  productId: number,
  size?: string,
  color?: string,
  sessionId?: string
): Promise<CartItem | null> {
  let sql: string;
  let params: any[];

  if (customerId) {
    sql = `
      SELECT * FROM cart_items 
      WHERE customer_id = ? 
        AND product_id = ? 
        AND (size = ? OR (size IS NULL AND ? IS NULL))
        AND (color = ? OR (color IS NULL AND ? IS NULL))
      LIMIT 1
    `;
    params = [customerId, productId, size || null, size || null, color || null, color || null];
  } else if (sessionId) {
    sql = `
      SELECT * FROM cart_items 
      WHERE session_id = ? 
        AND product_id = ? 
        AND (size = ? OR (size IS NULL AND ? IS NULL))
        AND (color = ? OR (color IS NULL AND ? IS NULL))
      LIMIT 1
    `;
    params = [sessionId, productId, size || null, size || null, color || null, color || null];
  } else {
    return null;
  }

  return await queryOne<CartItem>(sql, params);
}

// Add item to cart
export async function addCartItem(item: CartItemInput): Promise<number> {
  if (!item.customer_id && !item.session_id) {
    throw new Error("Either customer_id or session_id is required");
  }

  // Check if item already exists
  const existing = await findExistingCartItem(
    item.customer_id,
    item.product_id,
    item.size,
    item.color,
    item.session_id
  );

  if (existing) {
    // Update quantity
    const newQuantity = existing.quantity + item.quantity;
    await updateCartItemQuantity(existing.id, newQuantity);
    return existing.id;
  } else {
    // Insert new item
    const sql = `
      INSERT INTO cart_items (customer_id, session_id, product_id, quantity, size, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return await insert(sql, [
      item.customer_id || null,
      item.session_id || null,
      item.product_id,
      item.quantity,
      item.size || null,
      item.color || null,
    ]);
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(cartItemId: number, quantity: number): Promise<boolean> {
  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    return await removeCartItem(cartItemId);
  }
  const sql = "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?";
  const affected = await execute(sql, [quantity, cartItemId]);
  return affected > 0;
}

// Remove cart item
export async function removeCartItem(cartItemId: number): Promise<boolean> {
  const sql = "DELETE FROM cart_items WHERE id = ?";
  const affected = await execute(sql, [cartItemId]);
  return affected > 0;
}

// Clear all cart items for a customer
export async function clearCartByCustomerId(customerId: number): Promise<boolean> {
  const sql = "DELETE FROM cart_items WHERE customer_id = ?";
  const affected = await execute(sql, [customerId]);
  return affected >= 0; // Return true even if no items were deleted
}

// Merge guest cart items to customer cart (on login)
export async function mergeGuestCartToCustomer(sessionId: string, customerId: number): Promise<void> {
  // Get all guest cart items
  const guestItems = await getCartItemsBySessionId(sessionId);
  
  for (const item of guestItems) {
    // Check if customer already has this item
    const existing = await findExistingCartItem(
      customerId,
      item.product_id,
      item.size || undefined,
      item.color || undefined
    );

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + item.quantity;
      await updateCartItemQuantity(existing.id, newQuantity);
      // Remove the guest item
      await removeCartItem(item.id);
    } else {
      // Transfer the item to customer
      const sql = "UPDATE cart_items SET customer_id = ?, session_id = NULL WHERE id = ?";
      await execute(sql, [customerId, item.id]);
    }
  }
}

