import { mysqlTable, int, varchar, text, decimal, date, timestamp, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products Table
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(0),
  size: varchar("size", { length: 255 }),
  size_stock: json("size_stock"), // JSON object: {"16": 5, "18": 0, "20": 10} - stock per size
  color: varchar("color", { length: 100 }),
  description: text("description"),
  type: varchar("type", { length: 100 }),
  gender: varchar("gender", { length: 50 }),
  image: text("image").notNull(),
  hover_image: text("hover_image"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Users Table (Admin/Store Users)
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { length: 50 }).default("Active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Customers Table (Frontend Users)
export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Transactions Table
export const transactions = mysqlTable("transactions", {
  id: int("id").primaryKey().autoincrement(),
  transaction_id: varchar("transaction_id", { length: 100 }).notNull().unique(),
  user_id: int("user_id").notNull(),
  user_name: varchar("user_name", { length: 255 }).notNull(),
  product_id: int("product_id").notNull(),
  product_name: varchar("product_name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  status: varchar("status", { length: 50 }).default("Pending"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Categories Table
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Slides Table
export const slides = mysqlTable("slides", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: text("image").notNull(),
  date: date("date"),
  category: varchar("category", { length: 100 }),
  type: mysqlEnum("type", ["special", "normal"]).notNull().default("normal"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Settings Table
export const settings = mysqlTable("settings", {
  id: int("id").primaryKey().autoincrement(),
  setting_key: varchar("setting_key", { length: 100 }).notNull().unique(),
  setting_value: text("setting_value").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Cart Items Table
export const cartItems = mysqlTable("cart_items", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  session_id: varchar("session_id", { length: 255 }),
  product_id: int("product_id").notNull(),
  quantity: int("quantity").notNull().default(1),
  size: varchar("size", { length: 50 }),
  color: varchar("color", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Orders Table
export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  order_id: varchar("order_id", { length: 100 }).notNull().unique(),
  razorpay_order_id: varchar("razorpay_order_id", { length: 255 }),
  razorpay_payment_id: varchar("razorpay_payment_id", { length: 255 }),
  razorpay_signature: varchar("razorpay_signature", { length: 255 }),
  customer_name: varchar("customer_name", { length: 255 }).notNull(),
  customer_email: varchar("customer_email", { length: 255 }).notNull(),
  customer_phone: varchar("customer_phone", { length: 50 }),
  shipping_address: text("shipping_address").notNull(),
  shipping_city: varchar("shipping_city", { length: 100 }),
  shipping_state: varchar("shipping_state", { length: 100 }),
  shipping_zip: varchar("shipping_zip", { length: 20 }),
  shipping_country: varchar("shipping_country", { length: 100 }).default("India"),
  items: json("items").notNull(), // JSON array of cart items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "paid", "shipped", "delivered", "cancelled", "failed"]).default("pending"),
  payment_status: mysqlEnum("payment_status", ["pending", "success", "failed", "refunded"]).default("pending"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Zod Schemas
export const insertProductSchema = createInsertSchema(products);
export const insertUserSchema = createInsertSchema(users);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertCategorySchema = createInsertSchema(categories);
export const insertSlideSchema = createInsertSchema(slides);
export const insertSettingSchema = createInsertSchema(settings);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertOrderSchema = createInsertSchema(orders);

// Type exports
export type Product = typeof products.$inferSelect;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Slide = typeof slides.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertSlide = z.infer<typeof insertSlideSchema>;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

