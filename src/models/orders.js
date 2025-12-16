import { query, queryOne, insert, execute } from "./db.js";

// Get all orders
export async function getAllOrders() {
  const sql = "SELECT * FROM orders ORDER BY created_at DESC";
  return await query(sql);
}

// Get order by ID
export async function getOrderById(id) {
  const sql = "SELECT * FROM orders WHERE id = ?";
  return await queryOne(sql, [id]);
}

// Get order by order_id
export async function getOrderByOrderId(orderId) {
  const sql = "SELECT * FROM orders WHERE order_id = ?";
  return await queryOne(sql, [orderId]);
}

// Get order by Razorpay order ID
export async function getOrderByRazorpayOrderId(razorpayOrderId) {
  const sql = "SELECT * FROM orders WHERE razorpay_order_id = ?";
  return await queryOne(sql, [razorpayOrderId]);
}

// Get orders by customer ID
export async function getOrdersByCustomerId(customerId) {
  const sql = "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC";
  return await query(sql, [customerId]);
}

// Add order
export async function addOrder(order) {
  const sql = `
    INSERT INTO orders (
      order_id, customer_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
      customer_name, customer_email, customer_phone,
      shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country,
      items, subtotal, shipping, tax, total, status, payment_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return await insert(sql, [
    order.order_id,
    order.customer_id || null,
    order.razorpay_order_id || null,
    order.razorpay_payment_id || null,
    order.razorpay_signature || null,
    order.customer_name,
    order.customer_email,
    order.customer_phone || null,
    order.shipping_address,
    order.shipping_city || null,
    order.shipping_state || null,
    order.shipping_zip || null,
    order.shipping_country || "India",
    JSON.stringify(order.items),
    order.subtotal,
    order.shipping,
    order.tax,
    order.total,
    order.status || "pending",
    order.payment_status || "pending",
  ]);
}

// Update order
export async function updateOrder(id, updates) {
  const fields = [];
  const values = [];

  if (updates.razorpay_order_id !== undefined) {
    fields.push("razorpay_order_id = ?");
    values.push(updates.razorpay_order_id);
  }
  if (updates.customer_id !== undefined) {
    fields.push("customer_id = ?");
    values.push(updates.customer_id);
  }
  if (updates.razorpay_payment_id !== undefined) {
    fields.push("razorpay_payment_id = ?");
    values.push(updates.razorpay_payment_id);
  }
  if (updates.razorpay_signature !== undefined) {
    fields.push("razorpay_signature = ?");
    values.push(updates.razorpay_signature);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.payment_status !== undefined) {
    fields.push("payment_status = ?");
    values.push(updates.payment_status);
  }

  if (fields.length === 0) {
    return false;
  }

  values.push(id);
  const sql = `UPDATE orders SET ${fields.join(", ")} WHERE id = ?`;
  const result = await execute(sql, values);
  return result.affectedRows > 0;
}

// Update order status by order_id
export async function updateOrderStatus(orderId, status) {
  const sql = "UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?";
  const result = await execute(sql, [status, orderId]);
  if (result.affectedRows > 0) {
    return await getOrderByOrderId(orderId);
  }
  return null;
}

