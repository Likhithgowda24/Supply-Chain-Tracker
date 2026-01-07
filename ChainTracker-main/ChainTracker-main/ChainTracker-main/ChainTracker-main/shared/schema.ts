import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "manufacturer", "retailer", "supplier", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["placed", "confirmed", "shipped", "in-transit", "delivered", "cancelled"]);
export const shipmentStatusEnum = pgEnum("shipment_status", ["pending", "in-transit", "delivered", "delayed"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "online"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "confirmed", "failed"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["locked", "released", "refunded"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("customer"),
  avatar: text("avatar"),
  bio: text("bio"),
  phone: text("phone"),
  verified: boolean("verified").default(false),
  securityQuestion: text("security_question"),
  securityAnswer: text("security_answer"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// OTP table
export const otps = pgTable("otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: text("product_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category"),
  stock: integer("stock").default(0),
  image: text("image"),
  manufacturerId: varchar("manufacturer_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("placed"),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentId: text("payment_id"),
  shippingAddress: json("shipping_address"),
  location: json("location"),
  cancelReason: text("cancel_reason"),
  cancelDetails: text("cancel_details"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Shipments table
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: text("shipment_id").notNull().unique(),
  orderId: varchar("order_id").notNull(),
  status: shipmentStatusEnum("status").default("pending"),
  currentLocation: text("current_location"),
  destination: text("destination"),
  startLocation: text("start_location"),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Shipment history (for blockchain tracking)
export const shipmentHistory = pgTable("shipment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull(),
  status: text("status").notNull(),
  location: text("location"),
  txHash: text("tx_hash"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Support conversations (Customer-Admin chat)
export const supportConversations = pgTable("support_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  status: text("status").default("open"),
  subject: text("subject"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title"),
  message: text("message"),
  payload: json("payload"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Addresses
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Wishlist
export const wishlist = pgTable("wishlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Ratings table (customer ratings for products)
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id"),
  productId: varchar("product_id").notNull(),
  userId: varchar("user_id").notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// User wallets table
export const userWallets = pgTable("user_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  walletAddress: text("wallet_address").notNull().unique(),
  chainId: integer("chain_id").default(11155111), // Sepolia testnet
  verifiedAt: timestamp("verified_at"),
  isDefault: boolean("is_default").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Blockchain transactions table
export const blockchainTransactions = pgTable("blockchain_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  orderId: varchar("order_id"),
  transactionHash: text("transaction_hash").notNull().unique(),
  blockNumber: integer("block_number"),
  gasUsed: text("gas_used"),
  gasPrice: text("gas_price"),
  functionName: text("function_name"), // createOrder, acceptOrder, etc
  status: transactionStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Order blockchain mapping
export const orderBlockchain = pgTable("order_blockchain", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().unique(),
  contractAddress: text("contract_address"),
  txHashCreated: text("tx_hash_created"),
  txHashAccepted: text("tx_hash_accepted"),
  txHashShipped: text("tx_hash_shipped"),
  txHashDelivered: text("tx_hash_delivered"),
  escrowAmount: decimal("escrow_amount", { precision: 20, scale: 8 }),
  escrowStatus: escrowStatusEnum("escrow_status").default("locked"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
  role: true,
  phone: true,
  securityQuestion: true,
  securityAnswer: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  productId: true,
  name: true,
  description: true,
  price: true,
  category: true,
  stock: true,
  image: true,
  manufacturerId: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerId: true,
  productId: true,
  quantity: true,
  totalPrice: true,
  paymentMethod: true,
  shippingAddress: true,
  location: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  conversationId: true,
  senderId: true,
  content: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).pick({
  userId: true,
  productId: true,
});

export const insertAddressSchema = createInsertSchema(addresses).pick({
  userId: true,
  street: true,
  city: true,
  state: true,
  zipCode: true,
  country: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  orderId: true,
  productId: true,
  userId: true,
  rating: true,
  review: true,
});

export const insertUserWalletSchema = createInsertSchema(userWallets).pick({
  userId: true,
  walletAddress: true,
  chainId: true,
});

export const insertBlockchainTransactionSchema = createInsertSchema(blockchainTransactions).pick({
  userId: true,
  orderId: true,
  transactionHash: true,
  functionName: true,
});

export const insertOrderBlockchainSchema = createInsertSchema(orderBlockchain).pick({
  orderId: true,
  contractAddress: true,
  txHashCreated: true,
  escrowAmount: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type SupportConversation = typeof supportConversations.$inferSelect;
export type Wishlist = typeof wishlist.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type InsertBlockchainTransaction = z.infer<typeof insertBlockchainTransactionSchema>;
export type OrderBlockchain = typeof orderBlockchain.$inferSelect;
export type InsertOrderBlockchain = z.infer<typeof insertOrderBlockchainSchema>;
