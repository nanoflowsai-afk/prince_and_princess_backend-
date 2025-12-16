// TypeScript type definitions (replacing drizzle-orm schema)

// Users Table (Admin/Store Users)
export interface User {
  id: string; // UUID string
  name: string;
  email: string;
  username?: string; // Optional username field for storage compatibility
  phone?: string | null;
  status?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface InsertUser {
  name: string;
  email: string;
  username?: string; // Optional username field for storage compatibility
  phone?: string | null;
  status?: string;
}

