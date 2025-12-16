import { query, queryOne, insert, execute } from "./db.js";

// Get all transactions
export async function getAllTransactions() {
  const sql = "SELECT * FROM transactions ORDER BY date DESC, created_at DESC";
  return await query(sql);
}

// Get transaction by ID
export async function getTransactionById(id) {
  const sql = "SELECT * FROM transactions WHERE id = ?";
  return await queryOne(sql, [id]);
}

// Add transaction
export async function addTransaction(transaction) {
  const sql = `
    INSERT INTO transactions (transaction_id, user_id, user_name, product_id, product_name, amount, date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return await insert(sql, [
    transaction.transaction_id,
    transaction.user_id,
    transaction.user_name,
    transaction.product_id,
    transaction.product_name,
    transaction.amount,
    transaction.date,
    transaction.status || "Pending",
  ]);
}

