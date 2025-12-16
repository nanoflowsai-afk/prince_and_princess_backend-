import express from "express";
import { createServer } from "http";
import { testConnection } from "../models/db.js";
import * as productsDb from "../models/products.js";
import * as categoriesDb from "../models/categories.js";
import * as slidesDb from "../models/slides.js";
import * as usersDb from "../models/users.js";
import * as transactionsDb from "../models/transactions.js";
import * as settingsDb from "../models/settings.js";
import * as authDb from "../models/auth.js";
import * as ordersDb from "../models/orders.js";
import * as customerAuthDb from "../models/customerAuth.js";
import * as cartDb from "../models/cart.js";
import * as likedProductsDb from "../models/likedProducts.js";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function registerRoutes(httpServer, app) {
  // Test database connection on startup
  await testConnection();

  // ========== PRODUCTS API ==========
  app.get("/api/products", async (req, res) => {
    try {
      const products = await productsDb.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productsDb.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productId = await productsDb.addProduct(req.body);
      const product = await productsDb.getProductById(productId);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await productsDb.updateProduct(id, req.body);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      const product = await productsDb.getProductById(id);
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await productsDb.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== CATEGORIES API ==========
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await categoriesDb.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }
      const success = await categoriesDb.addCategory(name);
      if (!success) {
        return res.status(409).json({ error: "Category already exists" });
      }
      res.status(201).json({ message: "Category added successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/categories/:oldName", async (req, res) => {
    try {
      const { oldName } = req.params;
      const { newName } = req.body;
      if (!newName) {
        return res.status(400).json({ error: "New category name is required" });
      }
      const success = await categoriesDb.updateCategory(oldName, newName);
      if (!success) {
        return res.status(409).json({ error: "New category name already exists" });
      }
      res.json({ message: "Category updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const reassignedCount = await categoriesDb.deleteCategory(name);
      res.json({
        message: "Category deleted successfully",
        reassignedCount,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SLIDES API ==========
  app.get("/api/slides", async (req, res) => {
    try {
      const slides = await slidesDb.getAllSlides();
      res.json(slides);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Homepage highlights endpoint
  app.get("/api/homepage/highlights", async (req, res) => {
    try {
      // Return featured products (is_featured = true) and special slides
      const allProducts = await productsDb.getAllProducts();
      const featuredProducts = Array.isArray(allProducts) 
        ? allProducts.filter((p) => p.is_featured === true || p.is_featured === 1)
        : [];
      
      let specialSlides = [];
      try {
        specialSlides = await slidesDb.getSlidesByType("special");
      } catch (slideError) {
        // If slides table doesn't exist yet, return empty array
        console.log("Slides not available yet:", slideError.message);
      }
      
      res.json({
        featuredProducts: featuredProducts || [],
        specialSlides: specialSlides || [],
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/slides/:type", async (req, res) => {
    try {
      const { type } = req.params;
      if (type !== "special" && type !== "normal") {
        return res.status(400).json({ error: "Invalid slide type" });
      }
      const slides = await slidesDb.getSlidesByType(type);
      res.json(slides);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/slides", async (req, res) => {
    try {
      const slideId = await slidesDb.addSlide(req.body);
      const slide = await slidesDb.getSlideById(slideId);
      res.status(201).json(slide);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/slides/:type/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const type = req.params.type;
      if (type !== "special" && type !== "normal") {
        return res.status(400).json({ error: "Invalid slide type" });
      }
      const success = await slidesDb.updateSlide(id, type, req.body);
      if (!success) {
        return res.status(404).json({ error: "Slide not found" });
      }
      const slide = await slidesDb.getSlideById(id);
      res.json(slide);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/slides/:type/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const type = req.params.type;
      if (type !== "special" && type !== "normal") {
        return res.status(400).json({ error: "Invalid slide type" });
      }
      const success = await slidesDb.deleteSlide(id, type);
      if (!success) {
        return res.status(404).json({ error: "Slide not found" });
      }
      res.json({ message: "Slide deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== USERS API ==========
  app.get("/api/users", async (req, res) => {
    try {
      const users = await usersDb.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await usersDb.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await usersDb.updateUser(id, req.body);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = await usersDb.getUserById(id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== TRANSACTIONS API ==========
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await transactionsDb.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionId = await transactionsDb.addTransaction(req.body);
      const transaction = await transactionsDb.getTransactionById(transactionId);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SETTINGS API ==========
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await settingsDb.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const value = await settingsDb.getSetting(key);
      if (value === null) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json({ key, value: JSON.parse(value) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const success = await settingsDb.setSetting(key, JSON.stringify(value));
      if (!success) {
        return res.status(500).json({ error: "Failed to update setting" });
      }
      res.json({ message: "Setting updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== AUTHENTICATION API ==========
  // Simplified login: email + password + admin role (OTP removed)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      console.log(`[AUTH] Login attempt for: ${email}`);

      const user = await authDb.getUserByEmail(email);
      if (!user) {
        console.log(`[AUTH] User not found: ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`[AUTH] User found: ${user.email}, Role: ${user.role}`);

      // Use password_hash field from users table
      const passwordHash = user.password_hash || user.password;
      if (!passwordHash) {
        console.log(`[AUTH] No password hash found for user: ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = authDb.verifyPassword(password, passwordHash);
      if (!isValid) {
        console.log(`[AUTH] Password verification failed for: ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`[AUTH] Password verified for: ${email}`);

      // Check admin role (case-insensitive)
      const userRole = (user.role || "").toLowerCase().trim();
      if (userRole !== "admin") {
        console.log(`[AUTH] Access denied - Role is '${user.role}', expected 'admin'`);
        return res.status(403).json({ 
          error: "Access denied. Admin role required.",
          details: `Your current role is: ${user.role || "none"}. Please contact an administrator.`
        });
      }

      console.log(`[AUTH] Login successful for: ${email}`);

      // Return user info (without password fields)
      const { password: _, password_hash: __, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword,
        message: "Login successful"
      });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize default admin on startup
  authDb.initializeDefaultAdmin().catch(console.error);

  // Initialize customers table on startup
  customerAuthDb.initializeCustomersTable().catch(console.error);

  // ========== CUSTOMER AUTHENTICATION API ==========
  // Customer registration
  app.post("/api/customer/register", async (req, res) => {
    try {
      const { email, password, name, phone } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      // Check if customer already exists
      const existingCustomer = await customerAuthDb.getCustomerByEmail(email);
      if (existingCustomer) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create customer
      const customerId = await customerAuthDb.createCustomer(email, password, name, phone);
      const customer = await customerAuthDb.getCustomerById(customerId);

      if (!customer) {
        return res.status(500).json({ error: "Failed to create customer" });
      }

      // Return customer without password
      const { password: _, ...customerWithoutPassword } = customer;
      res.json({
        success: true,
        customer: customerWithoutPassword,
        message: "Registration successful"
      });
    } catch (error) {
      console.error("Error registering customer:", error);
      res.status(500).json({ error: error.message || "Failed to register customer" });
    }
  });

  // Customer login
  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const customer = await customerAuthDb.getCustomerByEmail(email);
      if (!customer) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = customerAuthDb.verifyPassword(password, customer.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Create session
      req.session.customerId = customer.id;

      // Return customer without password
      const { password: _, ...customerWithoutPassword } = customer;
      res.json({
        success: true,
        customer: customerWithoutPassword,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Error logging in customer:", error);
      res.status(500).json({ error: error.message || "Failed to login" });
    }
  });

  // Customer logout
  app.post("/api/customer/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logout successful" });
      });
    } catch (error) {
      console.error("Error logging out customer:", error);
      res.status(500).json({ error: error.message || "Failed to logout" });
    }
  });

  // Get customer by ID
  app.get("/api/customer/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const customer = await customerAuthDb.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { password: _, ...customerWithoutPassword } = customer;
      res.json(customerWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== CART API ==========
  // Get cart items for a customer
  app.get("/api/cart/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId, 10);
      if (!customerId || isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }
      const cartItems = await cartDb.getCartItemsByCustomerId(customerId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: error.message || "Failed to fetch cart" });
    }
  });

  // Add item to cart
  app.post("/api/cart/add", async (req, res) => {
    try {
      const { customer_id, product_id, quantity, size, color } = req.body;

      if (!customer_id || !product_id || !quantity) {
        return res.status(400).json({ error: "customer_id, product_id, and quantity are required" });
      }

      const cartItemId = await cartDb.addCartItem({
        customer_id,
        product_id,
        quantity,
        size,
        color,
      });

      const cartItem = await cartDb.getCartItemById(cartItemId);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: error.message || "Failed to add item to cart" });
    }
  });

  // Update cart item quantity
  app.put("/api/cart/:cartItemId", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.cartItemId, 10);
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      const success = await cartDb.updateCartItemQuantity(cartItemId, quantity);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      const cartItem = await cartDb.getCartItemById(cartItemId);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ error: error.message || "Failed to update cart item" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/:cartItemId", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.cartItemId, 10);
      const success = await cartDb.removeCartItem(cartItemId);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: error.message || "Failed to remove item from cart" });
    }
  });

  // Clear cart for a customer
  app.delete("/api/cart/clear/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId, 10);
      if (!customerId || isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }
      await cartDb.clearCartByCustomerId(customerId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ error: error.message || "Failed to clear cart" });
    }
  });

  // ========== GUEST CART API ==========
  // Get cart items for a session (guest)
  app.get("/api/cart/session/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }
      const cartItems = await cartDb.getCartItemsBySessionId(sessionId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching guest cart:", error);
      res.status(500).json({ error: error.message || "Failed to fetch guest cart" });
    }
  });

  // Add item to guest cart
  app.post("/api/cart/guest/add", async (req, res) => {
    try {
      const { session_id, product_id, quantity, size, color } = req.body;

      if (!session_id || !product_id || !quantity) {
        return res.status(400).json({ error: "session_id, product_id, and quantity are required" });
      }

      const cartItemId = await cartDb.addCartItem({
        session_id,
        product_id,
        quantity,
        size,
        color,
      });

      const cartItem = await cartDb.getCartItemById(cartItemId);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to guest cart:", error);
      res.status(500).json({ error: error.message || "Failed to add item to guest cart" });
    }
  });

  // Update guest cart item quantity
  app.put("/api/cart/guest/:cartItemId", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.cartItemId, 10);
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      const success = await cartDb.updateCartItemQuantity(cartItemId, quantity);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      const cartItem = await cartDb.getCartItemById(cartItemId);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating guest cart:", error);
      res.status(500).json({ error: error.message || "Failed to update guest cart item" });
    }
  });

  // Remove item from guest cart
  app.delete("/api/cart/guest/:cartItemId", async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.cartItemId, 10);
      const success = await cartDb.removeCartItem(cartItemId);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ message: "Item removed from guest cart" });
    } catch (error) {
      console.error("Error removing from guest cart:", error);
      res.status(500).json({ error: error.message || "Failed to remove item from guest cart" });
    }
  });

  // Merge guest cart to customer cart (on login)
  app.post("/api/cart/merge", async (req, res) => {
    try {
      const { session_id, customer_id } = req.body;

      if (!session_id || !customer_id) {
        return res.status(400).json({ error: "session_id and customer_id are required" });
      }

      await cartDb.mergeGuestCartToCustomer(session_id, customer_id);
      res.json({ message: "Guest cart merged successfully" });
    } catch (error) {
      console.error("Error merging guest cart:", error);
      res.status(500).json({ error: error.message || "Failed to merge guest cart" });
    }
  });

  // ========== LIKED PRODUCTS (WISHLIST) API ==========
  // Get liked products for a customer
  app.get("/api/liked-products/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId, 10);
      if (!customerId || isNaN(customerId)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }
      const likedProducts = await likedProductsDb.getLikedProductsByCustomerId(customerId);
      res.json(likedProducts);
    } catch (error) {
      console.error("Error fetching liked products:", error);
      res.status(500).json({ error: error.message || "Failed to fetch liked products" });
    }
  });

  // Toggle like/unlike product
  app.post("/api/liked-products/toggle", async (req, res) => {
    try {
      const { customer_id, product_id } = req.body;
      if (!customer_id || !product_id) {
        return res.status(400).json({ error: "customer_id and product_id are required" });
      }
      const isLiked = await likedProductsDb.toggleLikedProduct(customer_id, product_id);
      res.json({ isLiked, message: isLiked ? "Product added to wishlist" : "Product removed from wishlist" });
    } catch (error) {
      console.error("Error toggling liked product:", error);
      res.status(500).json({ error: error.message || "Failed to toggle liked product" });
    }
  });

  // Get customer orders
  app.get("/api/orders/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId, 10);
      console.log(`🔍 Fetching orders for customer ID: ${customerId}`);
      
      if (!customerId || isNaN(customerId)) {
        console.log(`❌ Invalid customer ID: ${req.params.customerId}`);
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      // TODO: Add proper authentication check here
      // For now, allow access but validate customer exists
      const customer = await customerAuthDb.getCustomerById(customerId);
      if (!customer) {
        console.log(`❌ Customer not found: ${customerId}`);
        return res.status(404).json({ error: "Customer not found" });
      }

      const customerOrders = await ordersDb.getOrdersByCustomerId(customerId);
      console.log(`✅ Found ${customerOrders.length} orders for customer ${customerId}`);
      console.log("Orders data:", customerOrders);
      res.json(customerOrders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
  });

  // ========== PAYMENT API (RAZORPAY) ==========
  // Initialize Razorpay
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log("🔍 Checking Razorpay configuration...");
  console.log("RAZORPAY_KEY_ID:", razorpayKeyId ? `${razorpayKeyId.substring(0, 10)}...` : "NOT FOUND");
  console.log("RAZORPAY_KEY_SECRET:", razorpayKeySecret ? "FOUND (hidden)" : "NOT FOUND");

  if (!razorpayKeyId || !razorpayKeySecret) {
    console.warn("⚠️  Razorpay keys not found in environment variables. Payment features will not work.");
    console.warn("⚠️  Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file and restart the server.");
  } else {
    console.log("✅ Razorpay keys loaded successfully");
  }

  const razorpay = razorpayKeyId && razorpayKeySecret
    ? new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      })
    : null;

  // Create Razorpay order
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      if (!razorpay) {
        console.error("❌ Razorpay not initialized. Keys missing or invalid.");
        return res.status(500).json({ 
          error: "Razorpay not configured",
          message: "Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file and restart the backend server."
        });
      }

      const { amount, currency = "INR", receipt, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Amount should be in paise (smallest currency unit)
      // If amount is in rupees, multiply by 100
      const amountInPaise = Math.round(amount * 100);

      const options = {
        amount: amountInPaise,
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {},
      };

      const razorpayOrder = await razorpay.orders.create(options);

      res.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  // Verify payment and create order record
  app.post("/api/payments/verify-payment", async (req, res) => {
    try {
      if (!razorpayKeySecret) {
        return res.status(500).json({ error: "Razorpay secret not configured" });
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderData,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification data" });
      }

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(text)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Create order in database
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const order = await ordersDb.addOrder({
        order_id: orderId,
        customer_id: orderData.customer_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        shipping_city: orderData.shipping_city,
        shipping_state: orderData.shipping_state,
        shipping_zip: orderData.shipping_zip,
        shipping_country: orderData.shipping_country || "India",
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        total: orderData.total,
        status: "paid",
        payment_status: "success",
      });

      res.json({
        success: true,
        order_id: orderId,
        message: "Payment verified and order created successfully",
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await ordersDb.getOrderByOrderId(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update order status
  app.put("/api/orders/:orderId/status", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const validStatuses = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updatedOrder = await ordersDb.updateOrderStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await ordersDb.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
