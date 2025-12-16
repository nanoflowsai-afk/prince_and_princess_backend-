import { query, queryOne, insert, execute } from "./db.js";

// Get all users
export async function getAllUsers() {
  const sql = "SELECT * FROM users ORDER BY created_at DESC";
  return await query(sql);
}

// Get user by ID
export async function getUserById(id) {
  const sql = "SELECT * FROM users WHERE id = ?";
  return await queryOne(sql, [id]);
}

// Update user
export async function updateUser(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push("email = ?");
    values.push(updates.email);
  }
  if (updates.phone !== undefined) {
    fields.push("phone = ?");
    values.push(updates.phone);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  const affectedRows = await execute(sql, values);
  return affectedRows > 0;
}

