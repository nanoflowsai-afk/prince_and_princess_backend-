import { query, queryOne, insert, execute } from "./db";

export interface Transaction {
  id: number;
  transaction_id: string;
  user_id: number;
  user_name: string;
  product_id: number;
  product_name: string;
  amount: number;
  date: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface TransactionInput {
  transaction_id: string;
  user_id: number;
  user_name: string;
  product_id: number;
  product_name: string;
  amount: number;
  date: string;
  status?: string;
}

// Get all transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  const sql = "SELECT * FROM transactions ORDER BY date DESC, created_at DESC";
  return await query<Transaction>(sql);
}

// Get transaction by ID
export async function getTransactionById(id: number): Promise<Transaction | null> {
  const sql = "SELECT * FROM transactions WHERE id = ?";
  return await queryOne<Transaction>(sql, [id]);
}

// Add transaction
export async function addTransaction(transaction: TransactionInput): Promise<number> {
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

