import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { generateTokens, verifyToken, generateOTP, hashPassword, verifyPassword, generateOrderId, generateProductId, generateShipmentId } from "./auth";
import { insertUserSchema, insertProductSchema, insertOrderSchema, users, orders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendOTPEmail, sendOrderAssignmentEmail } from "./sendgrid";
import { sendOTPSMS } from "./twilio";
import { registerBlockchainRoutes } from "./blockchain.routes";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, subMonths, subWeeks, isSameMonth, isSameWeek } from "date-fns";
import * as fs from "fs";

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = payload;
    req.userId = payload.userId;
    next();
  };

  // Register blockchain routes
  registerBlockchainRoutes(app, authMiddleware);

  // DEBUG: Check active storage mode
  app.get("/api/debug/storage", (req, res) => {
    res.json({
      storageType: storage.constructor.name,
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Unset",
        MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Unset"
      }
    });
  });

  // ============ AUTH ROUTES ============

  // Send OTP via Email
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, username, role } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

      await storage.storeOTP(email, otp, expiresAt);

      // Send OTP via SendGrid
      try {
        await sendOTPEmail(email, otp, username || "User");
        console.log(`✅ OTP email sent to ${email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send OTP email to ${email}:`, emailError);
        // Fallback: Log to console for development
        console.log(`📧 FALLBACK - OTP for ${email}: ${otp}`);
      }

      res.json({ message: "OTP sent", expiresAt });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Send OTP via Phone
  app.post("/api/auth/send-otp-phone", async (req, res) => {
    try {
      const { phone, username, role } = req.body;
      if (!phone) return res.status(400).json({ error: "Phone required" });

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

      await storage.storeOTP(phone, otp, expiresAt);

      // Send OTP via Twilio SMS
      try {
        await sendOTPSMS(phone, otp, username || "User");
        console.log(`✅ OTP SMS sent to ${phone}`);
      } catch (smsError: any) {
        console.error(`❌ Failed to send OTP SMS to ${phone}:`, smsError);
        // Fallback: Log to console for development
        console.log(`📱 FALLBACK - OTP for ${phone}: ${otp}`);

        // If Twilio is not configured, inform the user
        if (smsError.message?.includes('Twilio credentials not configured')) {
          console.log('⚠️  Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets to enable SMS.');
        }
      }

      res.json({ message: "OTP sent", expiresAt });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP & Create Session
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, phone, code, username, role } = req.body;

      if (!code || (!email && !phone)) {
        return res.status(400).json({ error: "Code and contact info required" });
      }

      const contactKey = email || phone;
      const storedOTP = await storage.getOTP(contactKey);

      if (!storedOTP) return res.status(400).json({ error: "OTP expired or not found" });

      if (storedOTP.attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(429).json({ error: "Too many attempts" });
      }

      if (storedOTP.code !== code) {
        await storage.incrementOTPAttempts(contactKey);
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // Clear OTP
      await storage.clearOTP(contactKey);

      // Get or create user
      let user = await storage.getUserByEmail(email || `${phone}@phone.local`);
      if (!user) {
        const hashedPassword = await hashPassword(Math.random().toString(36).slice(2));
        user = await storage.createUser({
          username: username || (email ? email.split("@")[0] : phone?.replace(/\D/g, "") || "user"),
          email: email || `${phone}@phone.local`,
          passwordHash: hashedPassword,
          phone: phone,
          role: (role as any) || "customer",
        });
      }

      const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role || "customer",
      });

      res.json({
        accessToken,
        refreshToken,
        userId: user.id,
        username: user.username,
        role: user.role,
        user
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ error: "OTP verification failed" });
    }
  });

  // Signup with password
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, role, securityQuestion, securityAnswer } = req.body;

      if (!username || !email || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ error: "All fields including security question are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        passwordHash: hashedPassword,
        role: (role as any) || "customer",
        securityQuestion,
        securityAnswer,
      });

      const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role || "customer",
      });

      res.json({ accessToken, refreshToken, user });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // Login with password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      const { accessToken, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role || "customer",
      });

      res.json({ accessToken, refreshToken, user });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get security question by email
  app.post("/api/auth/get-security-question", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "Email not found" });

      if (!user.securityQuestion) {
        return res.status(400).json({ error: "Security question not set up for this account" });
      }

      res.json({ success: true, question: user.securityQuestion });
    } catch (error) {
      console.error("Get security question error:", error);
      res.status(500).json({ error: "Failed to retrieve security question" });
    }
  });

  // Verify security answer and reset password
  app.post("/api/auth/reset-password-with-security", async (req, res) => {
    try {
      const { email, answer, newPassword } = req.body;
      if (!email || !answer || !newPassword) {
        return res.status(400).json({ error: "Email, answer, and new password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.securityQuestion || !user.securityAnswer) {
        return res.status(400).json({ error: "Security question not set up for this account" });
      }

      // Verify security answer
      const isCorrect = user.securityAnswer.toLowerCase() === answer.toLowerCase();
      if (!isCorrect) {
        return res.status(400).json({ error: "Incorrect security answer" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Hash new password and update user
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { passwordHash: hashedPassword });

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ============ PRODUCTS ROUTES ============

  // List products
  app.get("/api/products", async (req, res) => {
    try {
      const manufacturerId = req.query.manufacturerId as string | undefined;
      const products = await storage.listProducts(manufacturerId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get product by ID (supports both UUID and Display ID/SKU)
  app.get("/api/products/:id", async (req, res) => {
    try {
      // First try by Display ID (SKU)
      let product = await storage.getProductByProductId(req.params.id);

      // If not found, try by Internal UUID
      if (!product) {
        product = await storage.getProduct(req.params.id);
      }

      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Create product (manufacturer only)
  app.post("/api/products", authMiddleware, async (req: any, res) => {
    try {
      console.log("Create Product Body:", req.body);
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can create products" });
      }

      const { productId, name, description, price, category, stock, image } = req.body;

      if (!productId || !name || !price) {
        return res.status(400).json({ error: "Product ID, name and price are required" });
      }

      const product = await storage.createProduct({
        productId,
        name,
        description,
        price: price,
        stock: stock,
        image: image || null,
        manufacturerId: req.user.userId,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product (manufacturer only)
  app.patch("/api/products/:id", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can update products" });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // Check ownership
      if (product.manufacturerId !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { name, description, stock, price, image } = req.body;

      const updated = await storage.updateProduct(req.params.id, {
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        stock: stock !== undefined ? stock : product.stock,
        price: price !== undefined ? price : product.price,
        image: image !== undefined ? image : product.image,
      });

      res.json(updated);
    } catch (error) {
      console.error("Product update error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product (manufacturer and supplier)
  app.delete("/api/products/:id", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers and suppliers can delete products" });
      }

      // Try to find product by productId (display ID like "PROD-001") or internal UUID
      let product = await storage.getProduct(req.params.id);
      if (!product) {
        product = await storage.getProductByProductId(req.params.id);
      }

      if (!product) return res.status(404).json({ error: "Product not found" });

      // Check ownership (manufacturers own products by manufacturerId, suppliers can delete any product they manage)
      if (req.user.role === "manufacturer" && product.manufacturerId !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.deleteProduct(product.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Product deletion error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Create product rating (customer)
  app.post("/api/ratings", authMiddleware, async (req: any, res) => {
    try {
      const { productId, rating, review } = req.body;
      if (!productId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Valid productId and rating (1-5) required" });
      }

      const ratingRecord = await storage.createRating({
        userId: req.user.userId,
        productId,
        rating,
        review: review || null
      });

      // Get product and manufacturer details
      const product = await storage.getProductByProductId(productId);
      if (product) {
        // Notify manufacturer
        let message = `Customer rated your product "${product.name}" with ${rating} star${rating !== 1 ? "s" : ""}`;
        if (review) {
          message += ` and wrote: "${review}"`;
        }

        await storage.createNotification(
          product.manufacturerId,
          "rating",
          "New Product Rating",
          message,
          { productId, rating, review }
        );
      }

      res.status(201).json(ratingRecord);
    } catch (error) {
      console.error("Rating creation error:", error);
      res.status(500).json({ error: "Failed to submit rating" });
    }
  });

  // ============ DASHBOARD ROUTES ============

  // Get customer dashboard metrics
  app.get("/api/dashboard/metrics", authMiddleware, async (req: any, res) => {
    try {
      // Prevent caching for real-time updates
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "customer") {
        return res.status(403).json({ error: "This endpoint is only available for customer role" });
      }
      const metrics = await storage.getCustomerDashboardMetrics(req.user.userId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Get analytics data (live tracking)
  app.get("/api/analytics", authMiddleware, async (req: any, res) => {
    try {
      // Prevent caching for real-time updates
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      // Fetch orders based on user role
      let userOrders = [];
      if (req.user.role === "manufacturer") {
        userOrders = await storage.getManufacturerAllOrders(req.user.userId);
      } else {
        userOrders = await storage.listOrdersByCustomer(req.user.userId);
      }

      // Calculate real revenue from user's orders - sum all order totalPrices (exclude cancelled)
      const totalRevenue = userOrders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

      // Count active shipments in transit
      const activeShipments = userOrders.filter(o => o.status === "in-transit").length;

      // Calculate average delivery time
      // We'll use the difference between createdAt and now for delivered orders if we don't have deliveredAt
      // For now, let's just use a placeholder calculation or 0 if no delivered orders
      const deliveredOrders = userOrders.filter(o => o.status === "delivered");
      let avgDeliveryTime = 0;
      if (deliveredOrders.length > 0) {
        // This is an approximation since we don't track exact delivery time in this simple schema
        // We could use updatedAt if available, but for now let's leave it as 0 or a calculated estimate if possible
        // If we assume orders are delivered within 3-5 days for simulation:
        avgDeliveryTime = 0;
      }

      const satisfaction = await storage.getAverageRating();

      // Generate monthly sales and revenue data from real orders
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return {
          name: format(date, "MMM"),
          date: date
        };
      });

      const salesData = last6Months.map(month => {
        const count = userOrders.filter(o =>
          isSameMonth(new Date(o.createdAt), month.date) && o.status !== "cancelled"
        ).length;
        return { name: month.name, value: count };
      });

      const revenueData = last6Months.map(month => {
        const total = userOrders
          .filter(o => isSameMonth(new Date(o.createdAt), month.date) && o.status !== "cancelled")
          .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
        return { name: month.name, value: total };
      });

      // Generate weekly shipments data
      const last4Weeks = Array.from({ length: 4 }, (_, i) => {
        const date = subWeeks(new Date(), 3 - i);
        return {
          name: `Week ${i + 1}`,
          date: date
        };
      });

      const shipmentsData = last4Weeks.map(week => {
        const count = userOrders.filter(o =>
          isSameWeek(new Date(o.createdAt), week.date) && o.status !== "cancelled"
        ).length;
        return { name: week.name, value: count };
      });

      // Generate status distribution from real data
      const delivered = userOrders.filter(o => o.status === "delivered").length;
      const inTransit = userOrders.filter(o => o.status === "in-transit").length;
      const pending = userOrders.filter(o => o.status === "placed" || o.status === "confirmed").length; // Group placed/confirmed as pending
      const cancelled = userOrders.filter(o => o.status === "cancelled").length;

      const statusData = [
        { name: "Delivered", value: delivered },
        { name: "In Transit", value: inTransit },
        { name: "Pending", value: pending },
        { name: "Cancelled", value: cancelled } // Changed "Delayed" to "Cancelled" to be more accurate
      ];

      res.json({
        totalRevenue: Math.round(totalRevenue),
        activeShipments,
        avgDeliveryTime,
        satisfaction,
        salesData,
        revenueData,
        shipmentsData,
        statusData
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get manufacturer dashboard stats (live data)
  app.get("/api/manufacturer/stats", authMiddleware, async (req: any, res) => {
    try {
      // Prevent caching for real-time updates
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view stats" });
      }

      // Get all products by this manufacturer
      const manufacturerProducts = await storage.listProducts(req.user.role === "admin" ? undefined : req.user.userId);
      const totalProducts = manufacturerProducts.length;
      const inStock = manufacturerProducts.filter(p => (p.stock ?? 0) > 0).length;
      const inProduction = manufacturerProducts.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 100).length;

      // Get all orders for manufacturer's products
      const allOrders = await storage.getManufacturerAllOrders(req.user.userId);
      const manufacturerOrderIds = new Set<string>(allOrders.map(o => o.id));
      const retailerOrdersMap = new Map<string, number>();

      for (const order of allOrders) {
        // Count orders per user (retailer)
        const currentCount = retailerOrdersMap.get(order.customerId) || 0;
        retailerOrdersMap.set(order.customerId, currentCount + 1);
      }

      const activeOrders = manufacturerOrderIds.size;
      const pendingOrders = allOrders.filter(o =>
        manufacturerOrderIds.has(o.id) && o.status === "placed"
      ).length;
      const inProgressOrders = allOrders.filter(o =>
        manufacturerOrderIds.has(o.id) && o.status === "in-transit"
      ).length;

      // Get suppliers
      const suppliers = await storage.getSuppliersByManufacturer(req.user.userId);
      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.status === "active").length;
      const inactiveSuppliers = suppliers.filter(s => s.status === "inactive").length;

      // Calculate production metrics
      let productionRate = totalProducts > 0 ? Math.min(100, Math.round((inStock / totalProducts) * 100)) : 0;
      const onScheduleRate = activeOrders > 0 ? Math.round((inProgressOrders / activeOrders) * 100) : 0;
      const delayedRate = activeOrders > 0 ? Math.round((pendingOrders / activeOrders) * 100) : 0;

      // Production status breakdown - check if user has saved values
      let productionStatusBreakdown = {
        inProduction: 0,
        qualityCheck: 0,
        readyToShip: 0,
      };

      // Try to get saved production status from user bio
      const user = await storage.getUser(req.user.userId);
      console.log("📋 User bio data:", user?.bio);

      if (user && user.bio) {
        try {
          const bioData = JSON.parse(user.bio);
          console.log("✅ Parsed bio data:", bioData);

          if (bioData.productionStatus) {
            productionStatusBreakdown = bioData.productionStatus;
            productionRate = bioData.productionStatus.inProduction;
            console.log("🎯 Using saved production status:", productionStatusBreakdown);
          } else {
            // Calculate from orders if no saved values
            console.log("⚠️ No saved production status, calculating from orders");
            const readyToShip = allOrders.filter(o =>
              manufacturerOrderIds.has(o.id) && o.status === "delivered"
            ).length;
            const qualityCheckOrders = allOrders.filter(o =>
              manufacturerOrderIds.has(o.id) && o.status === "confirmed"
            ).length;

            const totalAllOrders = activeOrders;
            productionStatusBreakdown = {
              inProduction: totalAllOrders > 0 ? Math.round((pendingOrders / totalAllOrders) * 100) : 0,
              qualityCheck: totalAllOrders > 0 ? Math.round((qualityCheckOrders / totalAllOrders) * 100) : 0,
              readyToShip: totalAllOrders > 0 ? Math.round((readyToShip / totalAllOrders) * 100) : 0,
            };
          }
        } catch (e) {
          console.error("❌ Failed to parse bio data:", e);
          // If bio is not valid JSON, calculate from orders
          const readyToShip = allOrders.filter(o =>
            manufacturerOrderIds.has(o.id) && o.status === "delivered"
          ).length;
          const qualityCheckOrders = allOrders.filter(o =>
            manufacturerOrderIds.has(o.id) && o.status === "confirmed"
          ).length;

          const totalAllOrders = activeOrders;
          productionStatusBreakdown = {
            inProduction: totalAllOrders > 0 ? Math.round((pendingOrders / totalAllOrders) * 100) : 0,
            qualityCheck: totalAllOrders > 0 ? Math.round((qualityCheckOrders / totalAllOrders) * 100) : 0,
            readyToShip: totalAllOrders > 0 ? Math.round((readyToShip / totalAllOrders) * 100) : 0,
          };
        }
      } else {
        console.log("⚠️ User not found or no bio data");
      }

      // Top products (by stock)
      const topProducts = manufacturerProducts
        .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
        .slice(0, 3)
        .map(p => ({
          name: p.name,
          units: p.stock || 0,
        }));

      // Top suppliers (by orders)
      const topSuppliers = suppliers
        .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
        .slice(0, 3)
        .map(s => ({
          name: s.name,
          orders: s.totalOrders || 0,
        }));

      res.json({
        totalProducts,
        inStock,
        inProduction,
        activeOrders,
        pendingOrders,
        inProgressOrders,
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        productionRate,
        onScheduleRate,
        delayedRate,
        productionStatusBreakdown,
        topProducts,
        topSuppliers,
      });
    } catch (error) {
      console.error("Manufacturer stats error:", error);
      res.status(500).json({ error: "Failed to fetch manufacturer stats" });
    }
  });

  // Update production status
  app.post("/api/manufacturer/production-status", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can update production status" });
      }

      const { inProduction, qualityCheck, readyToShip } = req.body;

      // Validate input
      if (typeof inProduction !== "number" || typeof qualityCheck !== "number" || typeof readyToShip !== "number") {
        return res.status(400).json({ error: "Valid production status values required" });
      }

      if (inProduction < 0 || inProduction > 100 || qualityCheck < 0 || qualityCheck > 100 || readyToShip < 0 || readyToShip > 100) {
        return res.status(400).json({ error: "Values must be between 0-100" });
      }

      const user = await storage.getUser(req.user.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Parse existing bio data to preserve any other data
      let existingBioData = {};
      if (user.bio) {
        try {
          existingBioData = JSON.parse(user.bio);
        } catch (e) {
          existingBioData = {};
        }
      }

      // Create new bio data with production status
      const newBioData = {
        ...existingBioData,
        productionStatus: { inProduction, qualityCheck, readyToShip },
        productionRate: inProduction,
      };

      console.log("🔄 Saving production status for user:", req.user.userId);
      console.log("📊 Production status data:", newBioData.productionStatus);

      // Update user with production status preferences
      const updatedUser = await storage.updateUser(req.user.userId, {
        bio: JSON.stringify(newBioData)
      });

      console.log("✅ Production status saved. New bio:", updatedUser?.bio);

      res.json({
        success: true,
        productionStatus: { inProduction, qualityCheck, readyToShip },
        productionRate: inProduction
      });
    } catch (error) {
      console.error("Production status update error:", error);
      res.status(500).json({ error: "Failed to update production status" });
    }
  });

  // ============ ORDERS ROUTES ============

  // List orders for customer
  app.get("/api/orders", authMiddleware, async (req: any, res) => {
    try {
      const orders = await storage.listOrdersByCustomer(req.user.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrderByOrderId(req.params.orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Create order
  app.post("/api/orders", authMiddleware, async (req: any, res) => {
    try {
      const { productId, quantity, shippingAddress, location } = req.body;
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity required" });
      }

      // Get product by product_id (e.g., "PROD-001")
      const product = await storage.getProductByProductId(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // Check stock
      const currentStock = product.stock ?? 0;
      if (currentStock < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      // Create order
      const orderId = generateOrderId();
      const totalPrice = parseFloat(product.price) * quantity;

      const order = await storage.createOrder({
        orderId,
        customerId: req.user.userId,
        productId,
        quantity,
        totalPrice,
        shippingAddress,
        location,
      });

      // Decrement stock
      await storage.updateProduct(productId, {
        stock: currentStock - quantity,
      });

      // Create notification for manufacturer
      if (product.manufacturerId) {
        const customer = await storage.getUser(req.user.userId);
        await storage.createNotification(
          product.manufacturerId,
          "order",
          `New Order - ${product.name}`,
          `Customer ${customer?.username || "A customer"} ordered ${quantity} units of "${product.name}"`,
          { orderId, productId, quantity, customerId: req.user.userId }
        );
      }

      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Update order status
  app.patch("/api/orders/:orderId/status", authMiddleware, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const order = await storage.getOrderByOrderId(req.params.orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // Only manufacturer or admin can update
      // Try to get product by UUID first, then by product ID string
      let product = await storage.getProduct(order.productId);
      if (!product) {
        product = await storage.getProductByProductId(order.productId);
      }
      if (!product) return res.status(404).json({ error: "Product not found" });

      if (req.user.role !== "admin" && product.manufacturerId !== req.user.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await storage.updateOrderStatus(order.id, status);

      // Create notification for customer
      const statusMessages: any = {
        "confirmed": "Your order has been confirmed and is being prepared",
        "shipped": "Your order is on the way",
        "delivered": "Your order has been delivered",
        "in-transit": "Your order is in transit"
      };

      if (statusMessages[status]) {
        await storage.createNotification(
          order.customerId,
          "order",
          `Order ${order.orderId} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          statusMessages[status],
          { orderId: order.orderId, status }
        );
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Cancel/Update order (customer only)
  app.patch("/api/orders/:orderId", authMiddleware, async (req: any, res) => {
    try {
      const { status, cancelReason, cancelDetails } = req.body;

      if (status !== "cancelled" && status !== "delivered") {
        return res.status(400).json({ error: "Invalid status" });
      }

      const order = await storage.getOrderByOrderId(req.params.orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // Only the customer who placed the order can update
      if (order.customerId !== req.user.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Handle cancellation
      if (status === "cancelled") {
        // Can only cancel if not already shipped, delivered or cancelled
        if (order.status === "shipped" || order.status === "delivered" || order.status === "cancelled") {
          return res.status(400).json({ error: "Cannot cancel this order" });
        }

        const updated = await storage.updateOrderWithCancellation(order.id, cancelReason, cancelDetails);

        // Sync cancellation to manufacturer's assignedOrders so supplier sees it
        const allUsers = await storage.getAllUsers();
        for (const user of allUsers) {
          if (user.role !== "manufacturer" || !user.bio) continue;

          try {
            const bio = JSON.parse(user.bio);
            const assignedOrders = bio.assignedOrders || {};

            // Update order status to "cancelled" in all keys where it appears
            let updated_flag = false;
            for (const key of Object.keys(assignedOrders)) {
              const orders_list = assignedOrders[key];
              if (Array.isArray(orders_list)) {
                for (const ord of orders_list) {
                  if (ord.orderId === req.params.orderId) {
                    ord.status = "cancelled";
                    updated_flag = true;
                  }
                }
              }
            }

            if (updated_flag) {
              await storage.updateUser(user.id, { bio: JSON.stringify(bio) });
              console.log(`✅ Order ${req.params.orderId} marked as cancelled in manufacturer's bio`);
              break;
            }
          } catch (e) {
            console.error("Error updating manufacturer bio:", e);
          }
        }

        res.json(updated);
        return;
      }

      // Handle marking as delivered
      if (status === "delivered") {
        // Can only mark as delivered if currently shipped
        if (order.status !== "shipped") {
          return res.status(400).json({ error: "Order must be shipped to mark as delivered" });
        }

        const updated = await storage.updateOrderStatus(order.id, "delivered");

        // Sync delivered status to manufacturer's assignedOrders and find supplierId
        const allUsers = await storage.getAllUsers();
        // Get product to find manufacturer
        const product = await storage.getProductByProductId(order.productId);
        const manufacturerId = product?.manufacturerId;
        let supplierId = null;

        for (const user of allUsers) {
          if (user.role !== "manufacturer" || !user.bio) continue;

          try {
            const bio = JSON.parse(user.bio);
            const assignedOrders = bio.assignedOrders || {};

            let updated_flag = false;
            for (const key of Object.keys(assignedOrders)) {
              const orders_list = assignedOrders[key];
              if (Array.isArray(orders_list)) {
                for (const ord of orders_list) {
                  if (ord.orderId === req.params.orderId) {
                    ord.status = "delivered";
                    updated_flag = true;
                    // Capture the supplier ID from the key (supplier ID or email)
                    if (!supplierId) {
                      supplierId = key;
                    }
                  }
                }
              }
            }

            if (updated_flag) {
              await storage.updateUser(user.id, { bio: JSON.stringify(bio) });
              console.log(`✅ Order ${req.params.orderId} marked as delivered in manufacturer's bio`);
            }
          } catch (e) {
            console.error("Error updating manufacturer bio:", e);
          }
        }

        // Create notification for manufacturer
        if (manufacturerId) {
          await storage.createNotification(
            manufacturerId,
            "order",
            `Order ${order.orderId} - Delivered`,
            `Customer has confirmed delivery of order ${order.orderId}`,
            { orderId: order.orderId, status: "delivered" }
          );
          console.log(`✅ Delivery notification sent to manufacturer ${manufacturerId}`);
        }

        // Create notification for supplier
        if (supplierId) {
          await storage.createNotification(
            supplierId,
            "order",
            `Order ${order.orderId} - Delivered`,
            `Order ${order.orderId} has been delivered to customer`,
            { orderId: order.orderId, status: "delivered" }
          );
          console.log(`✅ Delivery notification sent to supplier ${supplierId}`);
        }

        res.json(updated);
        return;
      }
    } catch (error) {
      console.error("Order update error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // ============ USERS ROUTES ============

  // Update user profile
  app.patch("/api/users/profile", authMiddleware, async (req: any, res) => {
    try {
      const { name, bio, role, phone } = req.body;
      const user = await storage.updateUser(req.user.userId, {
        username: name,
        bio,
        role,
        phone,
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Upload user avatar
  app.post("/api/users/avatar", authMiddleware, async (req: any, res) => {
    try {
      const { avatar } = req.body;
      if (!avatar) {
        return res.status(400).json({ error: "Avatar data required" });
      }

      // Validate base64 image
      if (!avatar.startsWith('data:image/')) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      const user = await storage.updateUser(req.user.userId, {
        avatar,
      });
      res.json(user);
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  // ============ ADDRESS ROUTES ============

  // Get user's addresses
  app.get("/api/address", authMiddleware, async (req: any, res) => {
    try {
      const addresses = await storage.listAddressesByUser(req.user.userId);
      res.json(addresses);
    } catch (error) {
      console.error("Address fetch error:", error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  // Create or update address
  app.post("/api/address", authMiddleware, async (req: any, res) => {
    try {
      const { street, city, state, zipCode, country, isDefault } = req.body;

      if (!street || !city || !state || !zipCode || !country) {
        return res.status(400).json({ error: "All address fields are required" });
      }

      const address = await storage.createAddress({
        userId: req.user.userId,
        street,
        city,
        state,
        zipCode,
        country,
        isDefault: isDefault || false,
      });

      res.status(201).json(address);
    } catch (error) {
      console.error("Address creation error:", error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // ============ WISHLIST ROUTES ============

  // Get user's wishlist
  app.get("/api/wishlist", authMiddleware, async (req: any, res) => {
    try {
      const wishlistItems = await storage.getWishlistByUser(req.user.userId);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  // Add product to wishlist
  app.post("/api/wishlist", authMiddleware, async (req: any, res) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "Product ID required" });
      }
      const wishlistItem = await storage.addToWishlist(req.user.userId, productId);
      res.json(wishlistItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  // Remove product from wishlist
  app.delete("/api/wishlist/:productId", authMiddleware, async (req: any, res) => {
    try {
      await storage.removeFromWishlist(req.user.userId, req.params.productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  // ============ SUPPORT CHAT ROUTES ============

  // Get or create support conversation for customer
  app.get("/api/support/conversation", authMiddleware, async (req: any, res) => {
    try {
      let conversations = await storage.listSupportConversationsByCustomer(req.user.userId);

      if (conversations.length === 0) {
        const newConversation = await storage.createSupportConversation(req.user.userId);
        conversations = [newConversation];
      }

      res.json(conversations[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });


  // Helper to find manufacturer ID for an assigned order (needed for accept/decline if not provided)
  async function getManufacturerIdForOrder(supplierId: string, orderId: string): Promise<string> {
    const orders = await storage.getAssignedOrdersForSupplier(supplierId);
    const order = orders.find(o => o.orderId === orderId);
    if (!order) throw new Error("Order not found or not assigned to you");
    return order.manufacturerId;
  }

  // Get all support conversations (admin only)
  app.get("/api/support/conversations", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const conversations = await storage.listAllSupportConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/support/messages/:conversationId", authMiddleware, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByConversation(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message in conversation
  app.post("/api/support/messages", authMiddleware, async (req: any, res) => {
    try {
      const { conversationId, content } = req.body;

      if (!conversationId || !content) {
        return res.status(400).json({ error: "Conversation ID and content required" });
      }

      const message = await storage.sendMessage(conversationId, req.user.userId, content);
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark messages as read
  app.post("/api/support/messages/read/:conversationId", authMiddleware, async (req: any, res) => {
    try {
      await storage.markMessagesAsRead(req.params.conversationId, req.user.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // ============ NOTIFICATIONS ROUTES ============

  // Get notifications for logged-in user
  app.get("/api/notifications", authMiddleware, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:notificationId/read", authMiddleware, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.notificationId);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ============ CUSTOMERS ROUTES ============

  // List customers who ordered from this manufacturer
  app.get("/api/customers", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view customers" });
      }

      const customers = await storage.listCustomersByManufacturer(req.user.userId);
      res.json(customers);
    } catch (error) {
      console.error("Customers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // ============ RETAILERS ROUTES ============

  // List retailers who ordered from this manufacturer
  app.get("/api/retailers", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view retailers" });
      }

      const retailers = await storage.listRetailersByManufacturer(req.user.userId);
      res.json(retailers);
    } catch (error) {
      console.error("Retailers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch retailers" });
    }
  });

  // ============ MANUFACTURER PENDING ORDERS ROUTES ============

  // Get pending orders for manufacturer
  app.get("/api/manufacturer/pending-orders", authMiddleware, async (req: any, res) => {
    try {
      // Prevent caching for real-time updates
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view pending orders" });
      }

      const pendingOrders = await storage.getManufacturerPendingOrders(req.user.userId);
      res.json(pendingOrders);
    } catch (error) {
      console.error("Pending orders fetch error:", error);
      res.status(500).json({ error: "Failed to fetch pending orders" });
    }
  });

  // Get all orders for manufacturer
  app.get("/api/manufacturer/all-orders", authMiddleware, async (req: any, res) => {
    try {
      // Prevent caching for real-time updates
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view all orders" });
      }

      const allOrders = await storage.getManufacturerAllOrders(req.user.userId);
      res.json(allOrders);
    } catch (error) {
      console.error("All orders fetch error:", error);
      res.status(500).json({ error: "Failed to fetch all orders" });
    }
  });

  // ============ SUPPLIERS ROUTES ============

  // Get suppliers for manufacturer
  app.get("/api/manufacturer/suppliers", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view suppliers" });
      }

      const suppliers = await storage.getSuppliersByManufacturer(req.user.userId);
      res.json(suppliers);
    } catch (error) {
      console.error("Suppliers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  // Add new supplier
  app.post("/api/manufacturer/suppliers", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can add suppliers" });
      }

      const { name, email, phone, company, location } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const supplier = await storage.addSupplier(req.user.userId, {
        name,
        email,
        phone: phone || null,
        company: company || null,
        location: location || null,
      });

      res.json(supplier);
    } catch (error) {
      console.error("Add supplier error:", error);
      res.status(500).json({ error: "Failed to add supplier" });
    }
  });

  // Send order to supplier(s)
  app.post("/api/manufacturer/send-order", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can send orders to suppliers" });
      }

      const { orderId, supplierIds } = req.body;

      fs.appendFileSync("debug_log.txt", `[SEND-ORDER] Request: orderId=${orderId}, supplierIds=${JSON.stringify(supplierIds)}, manufacturerId=${req.user.userId}\n`);

      if (!orderId || !supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
        return res.status(400).json({ error: "Order ID and Supplier IDs (array) are required" });
      }

      let order = await storage.getOrder(orderId);
      if (!order) {
        order = await storage.getOrderByOrderId(orderId);
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "placed" && order.status !== "confirmed" && order.status !== "in-transit") {
        return res.status(400).json({ error: "Order is not in a valid state for assignment" });
      }

      const product = await storage.getProductByProductId(order.productId);
      const customer = await storage.getUser(order.customerId);
      const manufacturerUser = await storage.getUser(req.user.userId);

      const orderDetails = {
        orderId: order.orderId,
        productName: product?.name || "Unknown",
        productPrice: parseFloat(String(product?.price || 0)),
        customerName: customer?.username || "Unknown",
        customerEmail: customer?.email || "Unknown",
        customerId: order.customerId,
        quantity: order.quantity,
        totalPrice: (parseFloat(String(product?.price || 0)) * order.quantity).toString(),
        status: order.status,
      };

      const results = [];

      for (const supplierId of supplierIds) {
        try {
          let actualSupplierId = supplierId;
          let supplierUser = await storage.getUser(supplierId);

          // If not found as a direct User ID, check if it's a Supplier Contact ID
          if (!supplierUser) {
            const supplierContact = await storage.getSupplier(supplierId);
            if (supplierContact && supplierContact.email) {
              // Try to find user by email
              supplierUser = await storage.getUserByEmail(supplierContact.email);
              if (supplierUser) {
                actualSupplierId = supplierUser.id;
              } else {
                results.push({ supplierId, success: false, error: `Supplier contact found but no registered user with email ${supplierContact.email}` });
                continue;
              }
            } else {
              results.push({ supplierId, success: false, error: "Supplier not found" });
              continue;
            }
          }

          // Assign order to supplier
          await storage.assignOrderToSupplier(req.user.userId, actualSupplierId, orderId, orderDetails);
          fs.appendFileSync("debug_log.txt", `[SEND-ORDER] Assigned order ${orderId} to supplier ${actualSupplierId}\n`);

          // Create notification
          await storage.createNotification(
            actualSupplierId,
            "order_assigned",
            "New Order Assignment",
            `Order ${orderId} for ${orderDetails.productName} (₹${orderDetails.totalPrice}) has been assigned to you`,
            { orderId, manufacturerId: req.user.userId, productName: orderDetails.productName }
          );

          // Send email
          if (supplierUser.email) {
            try {
              await sendOrderAssignmentEmail(
                supplierUser.email,
                supplierUser.username || "Supplier",
                orderDetails,
                manufacturerUser?.username || "Manufacturer"
              );
            } catch (e) {
              console.error(`Failed to send email to ${supplierUser.email}:`, e);
            }
          }
          results.push({ supplierId, success: true });
        } catch (error) {
          console.error(`Failed to assign to supplier ${supplierId}:`, error);
          results.push({ supplierId, success: false, error: (error as any).message });
        }
      }

      res.json({ success: true, message: "Order sent to suppliers successfully", results });
    } catch (error) {
      console.error("Send order error:", error);
      res.status(500).json({ error: "Failed to send order to suppliers" });
    }
  });

  // Get assigned orders for a supplier (from manufacturer's perspective)
  app.get("/api/manufacturer/supplier-orders/:supplierId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can view supplier orders" });
      }

      const supplierId = req.params.supplierId;
      const orders = await storage.getSupplierAssignedOrders(req.user.userId, supplierId);
      res.json(orders);
    } catch (error) {
      console.error("Fetch supplier orders error:", error);
      res.status(500).json({ error: "Failed to fetch supplier orders" });
    }
  });

  // Get assigned orders for a supplier (from supplier's perspective) - only ACCEPTED
  app.get("/api/supplier/assigned-orders", authMiddleware, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can view assigned orders" });
      }

      const orders = await storage.getAssignedOrdersForSupplier(req.user.userId);
      res.json(orders);
    } catch (error) {
      console.error("Fetch assigned orders error:", error);
      res.status(500).json({ error: "Failed to fetch assigned orders" });
    }
  });

  // Get PENDING orders for a supplier - those awaiting acceptance
  app.get("/api/supplier/pending-orders", authMiddleware, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can view pending orders" });
      }

      const orders = await storage.getAssignedOrdersForSupplier(req.user.userId);
      const pendingOrders = orders.filter(o => o.status === "placed" || o.status === "pending_acceptance");
      res.json(pendingOrders);
    } catch (error) {
      console.error("Fetch pending orders error:", error);
      res.status(500).json({ error: "Failed to fetch pending orders" });
    }
  });

  // Accept an assigned order
  app.post("/api/supplier/accept-order/:orderId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier") {
        return res.status(403).json({ error: "Only suppliers can accept orders" });
      }

      const { orderId } = req.params;
      // We need the manufacturer ID. Since we don't have it in the params, we need to find it.
      // However, acceptOrder needs manufacturerId. 
      // The frontend should probably pass it, OR we can find the order first.
      // But getAssignedOrdersForSupplier returns manufacturerId in the order object.
      // Let's assume the frontend sends it in the body OR we find it.
      // Actually, storage.acceptOrder needs manufacturerId.
      // Let's look up the order first to find the manufacturer.

      // Wait, storage.acceptOrder iterates through manufacturers? No, it takes manufacturerId.
      // We need to find which manufacturer assigned this order to this supplier.
      // We can iterate through all users to find it, similar to getAssignedOrdersForSupplier.

      // Optimization: Pass manufacturerId from frontend.
      // But for now, let's find it.
      const orders = await storage.getAssignedOrdersForSupplier(req.user.userId);
      const order = orders.find(o => o.orderId === orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found or not assigned to you" });
      }

      await storage.acceptOrder(order.manufacturerId, req.user.userId, orderId);

      // Notify Manufacturer
      await storage.createNotification(
        order.manufacturerId,
        "order_accepted",
        "Order Accepted",
        `Supplier has accepted Order ${orderId}`,
        { orderId, supplierId: req.user.userId }
      );

      // Notify Customer
      if (order.customerId) {
        await storage.createNotification(
          order.customerId,
          "order_update",
          "Order Accepted",
          `Your order ${orderId} has been accepted by the supplier and is being prepared.`,
          { orderId, status: "accepted" }
        );
      }

      res.json({ success: true, message: "Order accepted successfully" });
    } catch (error) {
      console.error("Accept order error:", error);
      res.status(500).json({ error: (error as any).message });
    }
  });

  // Update order status (shipped, delivered, etc.)
  app.post("/api/supplier/update-order-status/:orderId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier") {
        return res.status(403).json({ error: "Only suppliers can update order status" });
      }

      const { orderId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Find manufacturer first
      const orders = await storage.getAssignedOrdersForSupplier(req.user.userId);
      const order = orders.find(o => o.orderId === orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found or not assigned to you" });
      }

      await storage.updateAssignedOrderStatus(order.manufacturerId, req.user.userId, orderId, status);

      // Notify Manufacturer
      await storage.createNotification(
        order.manufacturerId,
        "order_status_update",
        `Order ${status}`,
        `Order ${orderId} status updated to ${status}`,
        { orderId, supplierId: req.user.userId, status }
      );

      // Notify Customer
      if (order.customerId) {
        await storage.createNotification(
          order.customerId,
          "order_update",
          `Order ${status}`,
          `Your order ${orderId} is now ${status}.`,
          { orderId, status }
        );
      }

      res.json({ success: true, message: `Order marked as ${status}` });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Decline an assigned order
  app.post("/api/supplier/decline-order/:orderId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier") {
        return res.status(403).json({ error: "Only suppliers can decline orders" });
      }

      const { orderId } = req.params;

      // Find manufacturer first
      const orders = await storage.getAssignedOrdersForSupplier(req.user.userId);
      const order = orders.find(o => o.orderId === orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found or not assigned to you" });
      }

      await storage.declineOrder(order.manufacturerId, req.user.userId, orderId);
      res.json({ success: true, message: "Order declined successfully" });
    } catch (error) {
      console.error("Decline order error:", error);
      res.status(500).json({ error: "Failed to decline order" });
    }
  });

  // Get supplier stats
  app.get("/api/supplier/stats", authMiddleware, async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can view stats" });
      }

      // Get all assigned orders for this supplier
      const orders = await storage.getAssignedOrdersForSupplier(req.user.userId);

      // Calculate stats
      const totalInventory = orders.filter(o => o.status === "accepted").length;
      const lowStockItems = 0;
      const activeManufacturers = new Set(orders.map(o => o.manufacturerName)).size;
      const pendingOrders = orders.filter(o => o.status === "placed").length;
      const completedDeliveries = orders.filter(o => o.status === "delivered" || o.status === "shipped").length;

      // Calculate top products by order count (highest first)
      const productCounts: Record<string, { name: string; units: number }> = {};
      orders.forEach(order => {
        if (!productCounts[order.productName]) {
          productCounts[order.productName] = {
            name: order.productName,
            units: 0
          };
        }
        productCounts[order.productName].units += order.quantity;
      });

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);

      // Calculate top manufacturers by orders
      const manufacturerCounts: Record<string, { name: string; orders: number }> = {};
      orders.forEach(order => {
        if (!manufacturerCounts[order.manufacturerName]) {
          manufacturerCounts[order.manufacturerName] = {
            name: order.manufacturerName,
            orders: 0
          };
        }
        manufacturerCounts[order.manufacturerName].orders += 1;
      });

      const topManufacturers = Object.values(manufacturerCounts)
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      res.json({
        totalInventory,
        lowStockItems,
        activeManufacturers,
        pendingOrders,
        completedDeliveries,
        topProducts,
        topManufacturers,
      });
    } catch (error) {
      console.error("Supplier stats error:", error);
      res.status(500).json({ error: "Failed to fetch supplier stats" });
    }
  });

  // Accept an order as supplier
  app.post("/api/supplier/accept-order/:orderId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can accept orders" });
      }

      const orderId = req.params.orderId;
      const order = await storage.getOrderByOrderId(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Find which manufacturer assigned this order
      const allUsers = await storage.getAllUsers();
      let manufacturerId = null;

      for (const user of allUsers) {
        if (user.role !== "manufacturer") continue;
        const bio = user.bio ? JSON.parse(user.bio) : {};
        const assignedOrders = bio.assignedOrders || {};

        for (const key of Object.keys(assignedOrders)) {
          const orders = assignedOrders[key];
          if (Array.isArray(orders) && orders.some((o: any) => o.orderId === orderId)) {
            manufacturerId = user.id;
            break;
          }
        }
        if (manufacturerId) break;
      }

      if (!manufacturerId) {
        return res.status(404).json({ error: "Order assignment not found" });
      }

      await storage.acceptOrder(manufacturerId, req.user.userId, orderId);

      res.json({ success: true, message: "Order accepted successfully" });
    } catch (error) {
      console.error("Accept order error:", error);
      res.status(500).json({ error: "Failed to accept order" });
    }
  });

  // Update order status as supplier
  app.post("/api/supplier/update-order-status/:orderId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can update order status" });
      }

      const orderId = req.params.orderId;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const order = await storage.getOrderByOrderId(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Find which manufacturer assigned this order
      const allUsers = await storage.getAllUsers();
      let manufacturerId = null;

      for (const user of allUsers) {
        if (user.role !== "manufacturer") continue;
        const bio = user.bio ? JSON.parse(user.bio) : {};
        const assignedOrders = bio.assignedOrders || {};

        for (const key of Object.keys(assignedOrders)) {
          const orders = assignedOrders[key];
          if (Array.isArray(orders) && orders.some((o: any) => o.orderId === orderId)) {
            manufacturerId = user.id;
            break;
          }
        }
        if (manufacturerId) break;
      }

      if (!manufacturerId) {
        return res.status(404).json({ error: "Order assignment not found" });
      }

      await storage.updateAssignedOrderStatus(manufacturerId, req.user.userId, orderId, status);

      // Sync status to manufacturer's assignedOrders bio
      for (const user of allUsers) {
        if (user.role !== "manufacturer" || !user.bio) continue;

        try {
          const bio = JSON.parse(user.bio);
          const assignedOrders = bio.assignedOrders || {};

          let updated_flag = false;
          for (const key of Object.keys(assignedOrders)) {
            const orders_list = assignedOrders[key];
            if (Array.isArray(orders_list)) {
              for (const ord of orders_list) {
                if (ord.orderId === orderId) {
                  ord.status = status;
                  updated_flag = true;
                }
              }
            }
          }

          if (updated_flag) {
            await storage.updateUser(user.id, { bio: JSON.stringify(bio) });
            console.log(`✅ Order ${orderId} status synced to ${status} in manufacturer's bio`);
          }
        } catch (e) {
          console.error("Error updating manufacturer bio:", e);
        }
      }

      // Get supplier and manufacturer details for notifications
      const supplier = await storage.getUser(req.user.userId);
      const manufacturer = await storage.getUser(manufacturerId);

      // Create notifications for both customer and manufacturer
      const notificationTitle = `Order Status Updated: ${status.toUpperCase()}`;
      const notificationMessage = `Your order ${orderId} has been marked as ${status} by ${supplier?.username || "Supplier"}`;

      // Notify customer
      if (order.customerId) {
        await storage.createNotification(
          order.customerId,
          "order_update",
          notificationTitle,
          notificationMessage,
          { orderId }
        );
      }

      // Notify manufacturer
      if (manufacturer) {
        await storage.createNotification(
          manufacturerId,
          "order_update",
          notificationTitle,
          `Supplier ${supplier?.username || "Unknown"} updated order ${orderId} status to ${status}`,
          { orderId }
        );
      }

      // Notify supplier
      if (supplier) {
        await storage.createNotification(
          req.user.userId,
          "order_update",
          notificationTitle,
          `Order ${orderId} has been marked as ${status}`,
          { orderId }
        );
      }

      res.json({ success: true, message: `Order marked as ${status} and notifications sent` });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Decline an order as supplier
  app.post("/api/supplier/decline-order/:orderId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can decline orders" });
      }

      const orderId = req.params.orderId;
      const order = await storage.getOrderByOrderId(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Find which manufacturer assigned this order
      const allUsers = await storage.getAllUsers();
      let manufacturerId = null;

      for (const user of allUsers) {
        if (user.role !== "manufacturer") continue;
        const bio = user.bio ? JSON.parse(user.bio) : {};
        const assignedOrders = bio.assignedOrders || {};

        for (const key of Object.keys(assignedOrders)) {
          const orders = assignedOrders[key];
          if (Array.isArray(orders) && orders.some((o: any) => o.orderId === orderId)) {
            manufacturerId = user.id;
            break;
          }
        }
        if (manufacturerId) break;
      }

      if (!manufacturerId) {
        return res.status(404).json({ error: "Order assignment not found" });
      }

      await storage.declineOrder(manufacturerId, req.user.userId, orderId);

      res.json({ success: true, message: "Order declined and removed" });
    } catch (error) {
      console.error("Decline order error:", error);
      res.status(500).json({ error: "Failed to decline order" });
    }
  });

  // Delete supplier
  app.delete("/api/manufacturer/suppliers/:supplierId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can delete suppliers" });
      }

      const supplierId = req.params.supplierId;
      const manufacturerUser = await storage.getUser(req.user.userId);

      if (!manufacturerUser || !manufacturerUser.bio) {
        return res.status(400).json({ error: "No suppliers found" });
      }

      try {
        const bio = JSON.parse(manufacturerUser.bio);
        bio.suppliers = (bio.suppliers || []).filter((s: any) => s.id !== supplierId);
        await storage.updateUser(req.user.userId, { bio: JSON.stringify(bio) });
        res.json({ success: true });
      } catch {
        res.status(500).json({ error: "Failed to delete supplier" });
      }
    } catch (error) {
      console.error("Delete supplier error:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // ============ SUPPLIER CHAT ROUTES ============

  // Get chat messages with a supplier (from both perspectives)
  app.get("/api/supplier/chat", authMiddleware, async (req: any, res) => {
    try {
      const supplierEmail = req.query.supplierEmail;
      if (!supplierEmail) {
        return res.status(400).json({ error: "Supplier email required" });
      }

      let messages: any[] = [];

      if (req.user.role === "manufacturer" || req.user.role === "admin") {
        // Manufacturer viewing supplier chat - get messages sent AND received
        const manufacturerUser = await storage.getUser(req.user.userId);
        if (manufacturerUser?.bio) {
          try {
            const bio = JSON.parse(manufacturerUser.bio);
            // Messages sent to supplier
            const sentMessages = bio.chat?.[supplierEmail] || [];
            // Messages received from supplier
            const receivedMessages = bio.supplierChat?.[supplierEmail] || [];
            // Combine and sort by date
            messages = [...sentMessages, ...receivedMessages];
            messages.sort((a: any, b: any) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateA - dateB;
            });
          } catch {
            messages = [];
          }
        }
      } else {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json(messages);
    } catch (error) {
      console.error("Chat messages fetch error:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Send message to supplier
  app.post("/api/supplier/chat", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "manufacturer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only manufacturers can send supplier messages" });
      }

      const { supplierEmail, content } = req.body;

      if (!supplierEmail || !content) {
        return res.status(400).json({ error: "Supplier email and content required" });
      }

      const currentUser = await storage.getUser(req.user.userId);

      // Send message - use email as identifier
      const message = {
        id: randomUUID(),
        senderId: req.user.userId,
        senderName: currentUser?.username || "Manufacturer",
        senderEmail: currentUser?.email,
        content,
        createdAt: new Date().toISOString(),
      };

      // Store in manufacturer's bio
      const manufacturerUser = await storage.getUser(req.user.userId);
      if (manufacturerUser) {
        const manufacturerBio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { chat: {} };
        if (!manufacturerBio.chat) manufacturerBio.chat = {};
        if (!manufacturerBio.chat[supplierEmail]) manufacturerBio.chat[supplierEmail] = [];
        manufacturerBio.chat[supplierEmail].push(message);
        await storage.updateUser(req.user.userId, { bio: JSON.stringify(manufacturerBio) });
      }

      // Try to send notification if supplier exists in system
      try {
        const supplierUser = await storage.getUserByEmail(supplierEmail);
        if (supplierUser) {
          // Store in supplier's bio too - use manufacturerChat since this is from a manufacturer
          const supplierBio = supplierUser.bio ? JSON.parse(supplierUser.bio) : { manufacturerChat: {} };
          if (!supplierBio.manufacturerChat) supplierBio.manufacturerChat = {};
          const senderEmail = currentUser?.email;
          if (senderEmail) {
            if (!supplierBio.manufacturerChat[senderEmail]) supplierBio.manufacturerChat[senderEmail] = [];
            supplierBio.manufacturerChat[senderEmail].push(message);
            await storage.updateUser(supplierUser.id, { bio: JSON.stringify(supplierBio) });
          }

          // Create notification
          await storage.createNotification(
            supplierUser.id,
            "message",
            `New message from ${currentUser?.username || "Manufacturer"}`,
            content,
            {
              senderId: req.user.userId,
              senderName: currentUser?.username || "Manufacturer",
              messageType: "supplier-chat"
            }
          );
        }
      } catch (error) {
        console.error("Failed to deliver to supplier:", error);
        // Don't fail if supplier not in system
      }

      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ============ MANUFACTURERS ROUTES (for suppliers) ============

  // Get manufacturers for supplier
  app.get("/api/supplier/manufacturers", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can view manufacturers" });
      }

      const manufacturers = await storage.getManufacturersBySupplier(req.user.userId);
      res.json(manufacturers);
    } catch (error) {
      console.error("Manufacturers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch manufacturers" });
    }
  });

  // Add new manufacturer
  app.post("/api/supplier/manufacturers", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can add manufacturers" });
      }

      const { name, email, phone, company, location } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const manufacturer = await storage.addManufacturer(req.user.userId, {
        name,
        email,
        phone: phone || null,
        company: company || null,
        location: location || null,
      });

      res.json(manufacturer);
    } catch (error) {
      console.error("Add manufacturer error:", error);
      res.status(500).json({ error: "Failed to add manufacturer" });
    }
  });

  // Delete manufacturer
  app.delete("/api/supplier/manufacturers/:manufacturerId", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can delete manufacturers" });
      }

      const manufacturerId = req.params.manufacturerId;
      const supplierUser = await storage.getUser(req.user.userId);

      if (!supplierUser || !supplierUser.bio) {
        return res.status(400).json({ error: "No manufacturers found" });
      }

      try {
        const bio = JSON.parse(supplierUser.bio);
        bio.manufacturers = (bio.manufacturers || []).filter((m: any) => m.id !== manufacturerId);
        await storage.updateUser(req.user.userId, { bio: JSON.stringify(bio) });
        res.json({ success: true });
      } catch {
        res.status(500).json({ error: "Failed to delete manufacturer" });
      }
    } catch (error) {
      console.error("Delete manufacturer error:", error);
      res.status(500).json({ error: "Failed to delete manufacturer" });
    }
  });

  // ============ MANUFACTURER CHAT ROUTES (supplier to manufacturer) ============

  // Get chat messages with a manufacturer (from both perspectives)
  app.get("/api/supplier/manufacturers/chat", authMiddleware, async (req: any, res) => {
    try {
      const manufacturerEmail = req.query.manufacturerEmail;
      if (!manufacturerEmail) {
        return res.status(400).json({ error: "Manufacturer email required" });
      }

      let messages: any[] = [];

      if (req.user.role === "supplier" || req.user.role === "admin") {
        // Supplier viewing manufacturer chat - get messages from manufacturerChat (messages FROM manufacturer)
        const supplierUser = await storage.getUser(req.user.userId);
        if (supplierUser?.bio) {
          try {
            const bio = JSON.parse(supplierUser.bio);
            // Messages received from manufacturer
            const receivedMessages = bio.manufacturerChat?.[manufacturerEmail] || [];
            // Messages sent to manufacturer
            const sentMessages = bio.supplierChat?.[manufacturerEmail] || [];
            // Combine and sort
            messages = [...receivedMessages, ...sentMessages];
            messages.sort((a: any, b: any) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateA - dateB;
            });
          } catch {
            messages = [];
          }
        }
      } else {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json(messages);
    } catch (error) {
      console.error("Chat messages fetch error:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Send message to manufacturer
  app.post("/api/supplier/manufacturers/chat", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "supplier" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only suppliers can send manufacturer messages" });
      }

      const { manufacturerEmail, content } = req.body;

      if (!manufacturerEmail || !content) {
        return res.status(400).json({ error: "Manufacturer email and content required" });
      }

      const currentUser = await storage.getUser(req.user.userId);

      // Send message - use email as identifier
      const message = {
        id: randomUUID(),
        senderId: req.user.userId,
        senderName: currentUser?.username || "Supplier",
        senderEmail: currentUser?.email,
        content,
        createdAt: new Date().toISOString(),
      };

      // Store in supplier's bio
      const supplierUser = await storage.getUser(req.user.userId);
      if (supplierUser) {
        const supplierBio = supplierUser.bio ? JSON.parse(supplierUser.bio) : { manufacturerChat: {} };
        if (!supplierBio.manufacturerChat) supplierBio.manufacturerChat = {};
        if (!supplierBio.manufacturerChat[manufacturerEmail]) supplierBio.manufacturerChat[manufacturerEmail] = [];
        supplierBio.manufacturerChat[manufacturerEmail].push(message);
        await storage.updateUser(req.user.userId, { bio: JSON.stringify(supplierBio) });
      }

      // Try to send notification if manufacturer exists in system
      try {
        const manufacturerUser = await storage.getUserByEmail(manufacturerEmail);
        if (manufacturerUser) {
          // Store in manufacturer's bio too
          const manufacturerBio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { supplierChat: {} };
          if (!manufacturerBio.supplierChat) manufacturerBio.supplierChat = {};
          const senderEmail = currentUser?.email;
          if (senderEmail) {
            if (!manufacturerBio.supplierChat[senderEmail]) manufacturerBio.supplierChat[senderEmail] = [];
            manufacturerBio.supplierChat[senderEmail].push(message);
            await storage.updateUser(manufacturerUser.id, { bio: JSON.stringify(manufacturerBio) });
          }

          // Create notification
          await storage.createNotification(
            manufacturerUser.id,
            "message",
            `New message from ${currentUser?.username || "Supplier"}`,
            content,
            {
              senderId: req.user.userId,
              senderName: currentUser?.username || "Supplier",
              messageType: "manufacturer-chat"
            }
          );
        }
      } catch (error) {
        console.error("Failed to deliver to manufacturer:", error);
        // Don't fail if manufacturer not in system
      }

      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ============ ADDRESSES ROUTES ============

  // Get user's addresses
  app.get("/api/addresses", authMiddleware, async (req: any, res) => {
    try {
      const addresses = await storage.listAddressesByUser(req.user.userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  // Create new address
  app.post("/api/addresses", authMiddleware, async (req: any, res) => {
    try {
      const { street, city, state, zipCode, country } = req.body;

      const address = await storage.createAddress({
        userId: req.user.userId,
        street,
        city,
        state,
        zipCode,
        country,
      });

      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // Analytics Route
  app.get("/api/analytics", authMiddleware, async (req: any, res) => {
    try {
      console.log("Starting analytics fetch...");
      const manufacturerId = req.user.userId;
      const orders = await storage.getManufacturerAllOrders(manufacturerId);
      console.log(`Fetched ${orders.length} orders`);

      // Calculate Total Revenue
      const totalRevenue = orders.reduce((sum, order) => {
        const price = parseFloat(String(order.totalPrice || 0));
        const prodPrice = parseFloat(String(order.productPrice || 0));
        const qty = parseInt(String(order.quantity || 0));
        const val = price || (prodPrice * qty) || 0;
        return sum + val;
      }, 0);

      // Calculate Active Shipments
      const activeShipments = orders.filter(o =>
        o.status === 'shipped' || o.status === 'in-transit'
      ).length;

      // Avg Delivery Time (Mocked)
      const avgDeliveryTime = 3.2;

      // Customer Satisfaction (Mocked)
      const satisfaction = 4.8;

      // Sales & Revenue Data (Last 6 months)
      const salesData = [];
      const revenueData = [];
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(today, i);
        const monthName = format(date, 'MMM');

        const monthOrders = orders.filter(o => {
          if (!o.createdAt) return false;
          try {
            return isSameMonth(new Date(o.createdAt), date);
          } catch { return false; }
        });

        const monthSales = monthOrders.length;
        const monthRevenue = monthOrders.reduce((sum, order) => {
          const price = parseFloat(String(order.totalPrice || 0));
          const prodPrice = parseFloat(String(order.productPrice || 0));
          const qty = parseInt(String(order.quantity || 0));
          const val = price || (prodPrice * qty) || 0;
          return sum + val;
        }, 0);

        salesData.push({ name: monthName, value: monthSales });
        revenueData.push({ name: monthName, value: monthRevenue });
      }

      // Shipments Data (Last 4 weeks)
      const shipmentsData = [];
      for (let i = 3; i >= 0; i--) {
        const date = subWeeks(today, i);
        const weekName = `Week ${4 - i}`;

        const weekOrders = orders.filter(o => {
          if (!o.createdAt) return false;
          try {
            return isSameWeek(new Date(o.createdAt), date);
          } catch { return false; }
        });

        shipmentsData.push({ name: weekName, value: weekOrders.length });
      }

      // Status Data
      const statusCounts: Record<string, number> = {
        delivered: 0,
        shipped: 0, // mapping in-transit to shipped/in-transit
        pending: 0,
        cancelled: 0
      };

      orders.forEach(o => {
        const status = o.status?.toLowerCase() || 'pending';
        if (status === 'delivered') statusCounts.delivered++;
        else if (status === 'shipped' || status === 'in-transit') statusCounts.shipped++;
        else if (status === 'cancelled') statusCounts.cancelled++;
        else statusCounts.pending++;
      });

      const statusData = [
        { name: "Delivered", value: statusCounts.delivered },
        { name: "In Transit", value: statusCounts.shipped },
        { name: "Pending", value: statusCounts.pending },
        { name: "Cancelled", value: statusCounts.cancelled },
      ];

      res.json({
        totalRevenue,
        activeShipments,
        avgDeliveryTime,
        satisfaction,
        salesData,
        revenueData,
        shipmentsData,
        statusData
      });
    } catch (error: any) {
      console.error("Analytics error message:", error.message);
      console.error("Analytics error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
