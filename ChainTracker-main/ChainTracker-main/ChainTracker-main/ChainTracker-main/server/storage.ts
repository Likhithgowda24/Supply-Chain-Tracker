import { type User, type InsertUser, type Product, type Order, type Address, type ChatMessage, type SupportConversation, type Wishlist, type UserWallet, type BlockchainTransaction, type OrderBlockchain } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, otps, products, orders, addresses, wishlist, supportConversations, chatMessages, notifications, ratings, userWallets, blockchainTransactions, orderBlockchain } from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import * as fs from "fs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // OTP
  storeOTP(key: string, code: string, expiresAt: Date): Promise<void>;
  getOTP(key: string): Promise<{ code: string; expiresAt: Date; attempts: number } | undefined>;
  incrementOTPAttempts(key: string): Promise<void>;
  clearOTP(key: string): Promise<void>;

  // Security Questions
  verifySecurityAnswer(userId: string, answer: string): Promise<boolean>;
  updateSecurityQuestion(userId: string, question: string, answer: string): Promise<void>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductByProductId(productId: string): Promise<Product | undefined>;
  listProducts(manufacturerId?: string): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByOrderId(orderId: string): Promise<Order | undefined>;
  listOrdersByCustomer(customerId: string): Promise<Order[]>;
  createOrder(order: any): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderWithCancellation(id: string, cancelReason: string, cancelDetails?: string): Promise<Order | undefined>;
  getCustomerDashboardMetrics(customerId: string): Promise<{
    ordersPlaced: number;
    inTransit: number;
    shipped: number;
    delivered: number;
  }>;
  listCustomersByManufacturer(manufacturerId: string): Promise<any[]>;
  getManufacturerPendingOrders(manufacturerId: string): Promise<any[]>;
  getManufacturerAllOrders(manufacturerId: string): Promise<any[]>;
  listRetailersByManufacturer(manufacturerId: string): Promise<any[]>;

  // Addresses
  getAddress(id: string): Promise<Address | undefined>;
  listAddressesByUser(userId: string): Promise<Address[]>;
  createAddress(address: any): Promise<Address>;

  // Ratings
  createRating(rating: any): Promise<any>;
  getAverageRating(): Promise<number>;


  // Wishlist
  addToWishlist(userId: string, productId: string): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  getWishlistByUser(userId: string): Promise<Wishlist[]>;

  // Support Conversations
  createSupportConversation(customerId: string, subject?: string): Promise<SupportConversation>;
  getSupportConversation(id: string): Promise<SupportConversation | undefined>;
  listSupportConversationsByCustomer(customerId: string): Promise<SupportConversation[]>;
  listAllSupportConversations(): Promise<SupportConversation[]>;
  updateSupportConversationStatus(id: string, status: string): Promise<SupportConversation | undefined>;

  // Chat Messages
  sendMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage>;
  getMessagesByConversation(conversationId: string): Promise<ChatMessage[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  // Notifications
  createNotification(userId: string, type: string, title: string, message: string, payload?: any): Promise<any>;
  getNotificationsByUser(userId: string): Promise<any[]>;
  markNotificationAsRead(notificationId: string): Promise<any | undefined>;

  // Suppliers
  addSupplier(manufacturerId: string, supplier: any): Promise<any>;
  getSuppliersByManufacturer(manufacturerId: string): Promise<any[]>;
  getSupplier(supplierId: string): Promise<any | undefined>;
  deleteSupplier(supplierId: string): Promise<void>;

  // Supplier Chat
  sendSupplierMessage(manufacturerId: string, supplierId: string, senderName: string, content: string): Promise<any>;
  getSupplierChatMessages(manufacturerId: string, supplierId: string): Promise<any[]>;

  // Manufacturers (for suppliers)
  addManufacturer(supplierId: string, manufacturer: any): Promise<any>;
  getManufacturersBySupplier(supplierId: string): Promise<any[]>;
  deleteManufacturer(manufacturerId: string): Promise<void>;

  // Manufacturer Chat (supplier to manufacturer)
  sendManufacturerMessage(supplierId: string, manufacturerId: string, senderName: string, content: string): Promise<any>;
  getManufacturerChatMessages(supplierId: string, manufacturerId: string): Promise<any[]>;

  // Blockchain
  connectUserWallet(userId: string, walletAddress: string, chainId: number): Promise<UserWallet>;
  getUserWallet(userId: string): Promise<UserWallet | undefined>;
  recordBlockchainTransaction(data: any): Promise<BlockchainTransaction>;
  getBlockchainTransaction(txHash: string): Promise<BlockchainTransaction | undefined>;
  createOrderBlockchain(data: any): Promise<OrderBlockchain>;
  getOrderBlockchain(orderId: string): Promise<OrderBlockchain | undefined>;

  // Supplier Order Assignment
  assignOrderToSupplier(manufacturerId: string, supplierId: string, orderId: string, orderDetails: any): Promise<void>;
  getSupplierAssignedOrders(manufacturerId: string, supplierId: string): Promise<any[]>;
  getAssignedOrdersForSupplier(supplierId: string, statusFilter?: string): Promise<any[]>;
  acceptOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void>;
  updateAssignedOrderStatus(manufacturerId: string, supplierId: string, orderId: string, status: string): Promise<void>;
  declineOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private otps: Map<string, { code: string; expiresAt: Date; attempts: number }> = new Map();
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private addresses: Map<string, Address> = new Map();
  private ratings: Map<string, any> = new Map();
  private wishlist: Map<string, Wishlist> = new Map();
  private supportConversations: Map<string, SupportConversation> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private notifications: Map<string, any> = new Map();
  private userWallets: Map<string, UserWallet> = new Map();
  private blockchainTransactions: Map<string, BlockchainTransaction> = new Map();
  private orderBlockchain: Map<string, OrderBlockchain> = new Map();
  private suppliers: Map<string, any> = new Map();
  private manufacturerSuppliers: Map<string, any[]> = new Map(); // manufacturerId -> suppliers list
  private supplierManufacturers: Map<string, any[]> = new Map(); // supplierId -> manufacturers list
  private supplierChatMessages: Map<string, any[]> = new Map(); // manufacturerId_supplierId -> messages list

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      passwordHash: insertUser.passwordHash || null,
      role: insertUser.role || "customer",
      phone: insertUser.phone || null,
      avatar: null,
      bio: null,
      verified: false,
      securityQuestion: insertUser.securityQuestion || null,
      securityAnswer: insertUser.securityAnswer || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // OTP
  async storeOTP(key: string, code: string, expiresAt: Date): Promise<void> {
    this.otps.set(key, { code, expiresAt, attempts: 0 });
  }

  async getOTP(key: string): Promise<{ code: string; expiresAt: Date; attempts: number } | undefined> {
    const otp = this.otps.get(key);
    if (!otp || new Date() > otp.expiresAt) {
      this.otps.delete(key);
      return undefined;
    }
    return otp;
  }

  async incrementOTPAttempts(key: string): Promise<void> {
    const otp = this.otps.get(key);
    if (otp) {
      otp.attempts += 1;
    }
  }

  async clearOTP(key: string): Promise<void> {
    this.otps.delete(key);
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByProductId(productId: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find((p) => p.productId === productId);
  }

  async listProducts(manufacturerId?: string): Promise<Product[]> {
    let products = Array.from(this.products.values());
    if (manufacturerId) {
      products = products.filter((p) => p.manufacturerId === manufacturerId);
    }
    return products;
  }

  async createProduct(product: any): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: new Date(),
    } as Product;
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find((o) => o.orderId === orderId);
  }

  async listOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter((o) => o.customerId === customerId);
  }

  async createOrder(order: any): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = {
      ...order,
      id,
      status: order.status || "placed",
      paymentStatus: order.paymentStatus || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Order;
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status: status as any, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  async updateOrderWithCancellation(id: string, cancelReason: string, cancelDetails?: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status: "cancelled" as const, cancelReason, cancelDetails: cancelDetails || null, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  async getCustomerDashboardMetrics(customerId: string): Promise<{
    ordersPlaced: number;
    inTransit: number;
    shipped: number;
    delivered: number;
  }> {
    const customerOrders = Array.from(this.orders.values()).filter((o) => o.customerId === customerId && o.status !== "cancelled");
    return {
      ordersPlaced: customerOrders.length,
      inTransit: customerOrders.filter((o) => o.status === "confirmed").length,
      shipped: customerOrders.filter((o) => o.status === "shipped").length,
      delivered: customerOrders.filter((o) => o.status === "delivered").length,
    };
  }

  // Addresses
  async getAddress(id: string): Promise<Address | undefined> {
    return this.addresses.get(id);
  }

  async listAddressesByUser(userId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter((a) => a.userId === userId);
  }

  async createAddress(address: any): Promise<Address> {
    const id = randomUUID();
    const newAddress: Address = {
      ...address,
      id,
      createdAt: new Date(),
    } as Address;
    this.addresses.set(id, newAddress);
    return newAddress;
  }

  // Ratings
  async createRating(rating: any): Promise<any> {
    const id = randomUUID();
    const newRating = { ...rating, id, createdAt: new Date() };
    this.ratings.set(id, newRating);
    return newRating;
  }

  async getAverageRating(): Promise<number> {
    const ratings = Array.from(this.ratings.values());
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Number((sum / ratings.length).toFixed(1));
  }


  // Wishlist (stub implementations for MemStorage)
  // Wishlist
  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const id = randomUUID();
    const item: Wishlist = {
      id,
      userId,
      productId,
      createdAt: new Date(),
    };
    this.wishlist.set(id, item);
    return item;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const item = Array.from(this.wishlist.values()).find(
      (w) => w.userId === userId && w.productId === productId
    );
    if (item) {
      this.wishlist.delete(item.id);
    }
  }

  async getWishlistByUser(userId: string): Promise<Wishlist[]> {
    return Array.from(this.wishlist.values()).filter((w) => w.userId === userId);
  }

  // Support Conversations (stub implementations)
  // Support Conversations
  async createSupportConversation(customerId: string, subject?: string): Promise<SupportConversation> {
    const id = randomUUID();
    const conversation: SupportConversation = {
      id,
      customerId,
      subject: subject || "Support Request",
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supportConversations.set(id, conversation);
    return conversation;
  }

  async getSupportConversation(id: string): Promise<SupportConversation | undefined> {
    return this.supportConversations.get(id);
  }

  async listSupportConversationsByCustomer(customerId: string): Promise<SupportConversation[]> {
    return Array.from(this.supportConversations.values())
      .filter((c) => c.customerId === customerId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async listAllSupportConversations(): Promise<SupportConversation[]> {
    return Array.from(this.supportConversations.values())
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async updateSupportConversationStatus(id: string, status: string): Promise<SupportConversation | undefined> {
    const conversation = this.supportConversations.get(id);
    if (!conversation) return undefined;
    const updated = { ...conversation, status, updatedAt: new Date() };
    this.supportConversations.set(id, updated);
    return updated;
  }

  // Chat Messages (stub implementations)
  // Chat Messages
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      conversationId,
      senderId,
      content,
      read: false,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);

    // Update conversation timestamp
    const conversation = this.supportConversations.get(conversationId);
    if (conversation) {
      this.supportConversations.set(conversationId, { ...conversation, updatedAt: new Date() });
    }

    return message;
  }

  async getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const messages = Array.from(this.chatMessages.values()).filter(
      (m) => m.conversationId === conversationId && m.senderId === userId
    );
    for (const msg of messages) {
      this.chatMessages.set(msg.id, { ...msg, read: true });
    }
  }

  // Security Questions
  // Security Questions
  async verifySecurityAnswer(userId: string, answer: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.securityAnswer) return false;
    return user.securityAnswer.toLowerCase() === answer.toLowerCase();
  }

  async updateSecurityQuestion(userId: string, question: string, answer: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, securityQuestion: question, securityAnswer: answer });
    }
  }

  // Manufacturer/Supplier
  async listCustomersByManufacturer(manufacturerId: string): Promise<any[]> {
    const manufacturerProducts = Array.from(this.products.values()).filter(p => p.manufacturerId === manufacturerId);
    const productIds = new Set(manufacturerProducts.map(p => p.productId));
    const relevantOrders = Array.from(this.orders.values()).filter(o => productIds.has(o.productId));
    const customerIds = new Set(relevantOrders.map(o => o.customerId));

    const customers = [];
    for (const id of customerIds) {
      const user = this.users.get(id);
      if (user) customers.push(user);
    }
    return customers;
  }
  async getManufacturerPendingOrders(manufacturerId: string): Promise<any[]> {
    const allOrders = Array.from(this.orders.values());
    const manufacturerOrders = [];

    for (const order of allOrders) {
      const product = Array.from(this.products.values()).find(p => p.productId === order.productId);
      if (product && product.manufacturerId === manufacturerId && (order.status === "placed" || order.status === "confirmed" || order.status === "in-transit" || order.status === "shipped")) {
        const customer = this.users.get(order.customerId);
        manufacturerOrders.push({
          ...order,
          productName: product.name,
          productPrice: parseFloat(product.price),
          productDescription: product.description,
          customerName: customer?.username || "Unknown",
          customerEmail: customer?.email || "Unknown",
          dueDate: new Date(order.createdAt!.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // Mock due date
        });
      }
    }
    return manufacturerOrders.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getManufacturerAllOrders(manufacturerId: string): Promise<any[]> {
    const allOrders = Array.from(this.orders.values());
    const manufacturerOrders = [];

    for (const order of allOrders) {
      const product = Array.from(this.products.values()).find(p => p.productId === order.productId);
      if (product && product.manufacturerId === manufacturerId) {
        const customer = this.users.get(order.customerId);
        manufacturerOrders.push({
          ...order,
          productName: product.name,
          productPrice: parseFloat(product.price),
          customerName: customer?.username || "Unknown",
          customerEmail: customer?.email || "Unknown",
        });
      }
    }
    return manufacturerOrders.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async listRetailersByManufacturer(manufacturerId: string): Promise<any[]> {
    const allOrders = Array.from(this.orders.values());
    const retailerIds = new Set<string>();
    const retailers = [];

    for (const order of allOrders) {
      const product = this.products.get(order.productId);
      if (product && product.manufacturerId === manufacturerId) {
        retailerIds.add(order.customerId);
      }
    }

    for (const retailerId of retailerIds) {
      const user = this.users.get(retailerId);
      if (user) {
        // Calculate total orders and revenue for this retailer
        const retailerOrders = allOrders.filter(o => o.customerId === retailerId);
        let totalOrders = 0;
        let totalRevenue = 0;

        for (const order of retailerOrders) {
          const product = Array.from(this.products.values()).find(p => p.productId === order.productId);
          if (product && product.manufacturerId === manufacturerId) {
            totalOrders++;
            totalRevenue += parseFloat(order.totalPrice);
          }
        }

        retailers.push({
          id: user.id,
          name: user.username,
          email: user.email,
          location: "Unknown", // Mock location
          totalOrders,
          totalRevenue,
          status: "Active", // Mock status
          lastOrderDate: retailerOrders.length > 0 ? retailerOrders[retailerOrders.length - 1].createdAt : null
        });
      }
    }
    return retailers;
  }

  async addSupplier(manufacturerId: string, supplier: any): Promise<any> {
    const id = randomUUID();
    const newSupplier = { ...supplier, id, status: "active", createdAt: new Date() };
    this.suppliers.set(id, newSupplier);

    // Link to manufacturer
    const currentSuppliers = this.manufacturerSuppliers.get(manufacturerId) || [];
    currentSuppliers.push(newSupplier);
    this.manufacturerSuppliers.set(manufacturerId, currentSuppliers);

    console.log(`[STORAGE] Added supplier ${id} for manufacturer ${manufacturerId}`);
    return newSupplier;
  }

  async getSuppliersByManufacturer(manufacturerId: string): Promise<any[]> {
    return this.manufacturerSuppliers.get(manufacturerId) || [];
  }

  async getSupplier(supplierId: string): Promise<any | undefined> {
    const s = this.suppliers.get(supplierId);
    return s;
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    this.suppliers.delete(supplierId);
    // Remove from all manufacturer lists (inefficient but works for mem storage)
    for (const [mId, suppliers] of this.manufacturerSuppliers.entries()) {
      this.manufacturerSuppliers.set(mId, suppliers.filter(s => s.id !== supplierId));
    }
  }

  async sendSupplierMessage(manufacturerId: string, supplierId: string, senderName: string, content: string): Promise<any> {
    const key = `${manufacturerId}_${supplierId}`;
    const messages = this.supplierChatMessages.get(key) || [];
    const newMessage = {
      id: randomUUID(),
      senderName,
      content,
      timestamp: new Date(),
      isMe: true // Assuming sender is always "me" for the caller context in this simple implementation
    };
    messages.push(newMessage);
    this.supplierChatMessages.set(key, messages);
    return newMessage;
  }

  async getSupplierChatMessages(manufacturerId: string, supplierId: string): Promise<any[]> {
    const key = `${manufacturerId}_${supplierId}`;
    return this.supplierChatMessages.get(key) || [];
  }

  async addManufacturer(supplierId: string, manufacturer: any): Promise<any> {
    const supplierUser = await this.getUser(supplierId);

    if (!supplierUser) {
      throw new Error("Supplier not found");
    }

    const bio = supplierUser.bio ? JSON.parse(supplierUser.bio) : { manufacturers: [] };
    if (!bio.manufacturers) bio.manufacturers = [];

    const newManufacturer = {
      id: randomUUID(),
      ...manufacturer,
      createdAt: new Date().toISOString(),
    };

    bio.manufacturers.push(newManufacturer);
    await this.updateUser(supplierId, { bio: JSON.stringify(bio) });

    return newManufacturer;
  }

  async getManufacturersBySupplier(supplierId: string): Promise<any[]> {
    const supplierUser = await this.getUser(supplierId);

    if (!supplierUser || !supplierUser.bio) {
      return [];
    }

    try {
      const bio = JSON.parse(supplierUser.bio);
      return bio.manufacturers || [];
    } catch {
      return [];
    }
  }

  async deleteManufacturer(manufacturerId: string): Promise<void> {
    // Stub
  }

  async sendManufacturerMessage(supplierId: string, manufacturerId: string, senderName: string, content: string): Promise<any> {
    // Re-use supplier chat logic but reverse keys if needed, or share same key
    const key = `${manufacturerId}_${supplierId}`;
    const messages = this.supplierChatMessages.get(key) || [];
    const newMessage = {
      id: randomUUID(),
      senderName,
      content,
      timestamp: new Date(),
      isMe: true
    };
    messages.push(newMessage);
    this.supplierChatMessages.set(key, messages);
    return newMessage;
  }

  async getManufacturerChatMessages(supplierId: string, manufacturerId: string): Promise<any[]> {
    const key = `${manufacturerId}_${supplierId}`;
    return this.supplierChatMessages.get(key) || [];
  }

  async assignOrderToSupplier(manufacturerId: string, supplierId: string, orderId: string, orderDetails: any): Promise<void> {
    const manufacturer = this.users.get(manufacturerId);
    if (!manufacturer) return;

    let bio: any = {};
    try {
      bio = manufacturer.bio ? JSON.parse(manufacturer.bio) : {};
    } catch (e) {
      bio = {};
    }
    if (!bio || typeof bio !== 'object') bio = {};

    if (!bio.assignedOrders) bio.assignedOrders = {};
    if (!Array.isArray(bio.assignedOrders[supplierId])) bio.assignedOrders[supplierId] = [];

    // Check if already assigned
    const exists = bio.assignedOrders[supplierId].some((o: any) => o.orderId === orderId);
    if (!exists) {
      bio.assignedOrders[supplierId].push({
        ...orderDetails,
        assignedAt: new Date(),
        status: "pending_acceptance"
      });
      this.users.set(manufacturerId, { ...manufacturer, bio: JSON.stringify(bio) });
    }
  }

  async getSupplierAssignedOrders(manufacturerId: string, supplierId: string): Promise<any[]> {
    const manufacturer = this.users.get(manufacturerId);
    if (!manufacturer || !manufacturer.bio) return [];
    try {
      const bio = JSON.parse(manufacturer.bio);
      return bio.assignedOrders?.[supplierId] || [];
    } catch {
      return [];
    }
  }

  async getAssignedOrdersForSupplier(supplierId: string, statusFilter?: string): Promise<any[]> {
    const orders: any[] = [];
    for (const user of this.users.values()) {
      if (user.role === "manufacturer" && user.bio) {
        try {
          const bio = JSON.parse(user.bio);
          const assigned = bio.assignedOrders?.[supplierId];
          if (assigned && Array.isArray(assigned)) {
            const manufacturerName = user.username;
            const manufacturerEmail = user.email;

            assigned.forEach((order: any) => {
              if (!statusFilter || order.status === statusFilter || (statusFilter === 'pending' && order.status === 'placed')) {
                orders.push({
                  ...order,
                  manufacturerId: user.id,
                  manufacturerName,
                  manufacturerEmail
                });
              }
            });
          }
        } catch { }
      }
    }
    return orders.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }

  async acceptOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void> {
    const manufacturer = this.users.get(manufacturerId);
    if (!manufacturer || !manufacturer.bio) return;

    try {
      const bio = JSON.parse(manufacturer.bio);
      if (!bio.assignedOrders) return;

      // 1. Check if order is already accepted by anyone (Race Condition Check)
      let alreadyAccepted = false;
      Object.keys(bio.assignedOrders).forEach(sId => {
        const orders = bio.assignedOrders[sId];
        if (Array.isArray(orders)) {
          const acceptedOrder = orders.find((o: any) => o.orderId === orderId && o.status === "accepted");
          if (acceptedOrder) alreadyAccepted = true;
        }
      });

      if (alreadyAccepted) {
        throw new Error("Order has already been accepted by another supplier");
      }

      // 2. Accept for current supplier
      if (bio.assignedOrders[supplierId]) {
        const orderIndex = bio.assignedOrders[supplierId].findIndex((o: any) => o.orderId === orderId);
        if (orderIndex !== -1) {
          bio.assignedOrders[supplierId][orderIndex].status = "accepted";
          bio.assignedOrders[supplierId][orderIndex].updatedAt = new Date();
        }
      }

      // 3. Remove from all OTHER suppliers
      Object.keys(bio.assignedOrders).forEach(sId => {
        if (sId !== supplierId && Array.isArray(bio.assignedOrders[sId])) {
          bio.assignedOrders[sId] = bio.assignedOrders[sId].filter((o: any) => o.orderId !== orderId);
        }
      });

      this.users.set(manufacturerId, { ...manufacturer, bio: JSON.stringify(bio) });

      // 4. Update MAIN order status (CRITICAL for tracking)
      // Find the order in the main orders map by orderId (which is a string like "ORD-...")
      // The orders map is keyed by an internal ID (integer string), so we need to search.
      const allOrders = Array.from(this.orders.values());
      const mainOrder = allOrders.find(o => o.orderId === orderId);
      if (mainOrder) {
        const updatedMainOrder = { ...mainOrder, status: "accepted", updatedAt: new Date() };
        this.orders.set(mainOrder.id, updatedMainOrder as any);
      } else {
        console.log(`[STORAGE] acceptOrder: Order ${orderId} NOT FOUND in main orders. Available IDs: ${allOrders.map(o => o.orderId).join(", ")}`);
      }

    } catch (e) {
      console.error("Error in acceptOrder:", e);
      throw e;
    }
  }

  async updateAssignedOrderStatus(manufacturerId: string, supplierId: string, orderId: string, status: string): Promise<void> {
    const manufacturer = this.users.get(manufacturerId);
    if (!manufacturer || !manufacturer.bio) return;

    try {
      const bio = JSON.parse(manufacturer.bio);
      if (bio.assignedOrders?.[supplierId]) {
        const orderIndex = bio.assignedOrders[supplierId].findIndex((o: any) => o.orderId === orderId);
        if (orderIndex !== -1) {
          bio.assignedOrders[supplierId][orderIndex].status = status;
          bio.assignedOrders[supplierId][orderIndex].updatedAt = new Date();
          this.users.set(manufacturerId, { ...manufacturer, bio: JSON.stringify(bio) });

          // Sync to MAIN order status
          const allOrders = Array.from(this.orders.values());
          const mainOrder = allOrders.find(o => o.orderId === orderId);
          if (mainOrder) {
            const updatedMainOrder = { ...mainOrder, status: status, updatedAt: new Date() };
            this.orders.set(mainOrder.id, updatedMainOrder as any);
            console.log(`[STORAGE] Synced status '${status}' to main order ${orderId}`);
          }
        }
      }
    } catch { }
  }

  async declineOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void> {
    const manufacturer = this.users.get(manufacturerId);
    if (!manufacturer || !manufacturer.bio) return;

    try {
      const bio = JSON.parse(manufacturer.bio);
      if (bio.assignedOrders?.[supplierId]) {
        bio.assignedOrders[supplierId] = bio.assignedOrders[supplierId].filter((o: any) => o.orderId !== orderId);
        this.users.set(manufacturerId, { ...manufacturer, bio: JSON.stringify(bio) });
      }
    } catch { }
  }


  // Notifications
  // Notifications
  async createNotification(userId: string, type: string, title: string, message: string, payload?: any): Promise<any> {
    const id = randomUUID();
    const notification = {
      id,
      userId,
      type,
      title,
      message,
      payload,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<any[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async markNotificationAsRead(notificationId: string): Promise<any | undefined> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return undefined;
    const updated = { ...notification, read: true };
    this.notifications.set(notificationId, updated);
    return updated;
  }

  // Blockchain
  // Blockchain
  async connectUserWallet(userId: string, walletAddress: string, chainId: number): Promise<UserWallet> {
    const id = randomUUID();
    const wallet: UserWallet = {
      id,
      userId,
      walletAddress,
      chainId,
      verifiedAt: new Date(),
      isDefault: true,
      createdAt: new Date(),
    };
    this.userWallets.set(id, wallet);
    return wallet;
  }

  async getUserWallet(userId: string): Promise<UserWallet | undefined> {
    return Array.from(this.userWallets.values()).find((w) => w.userId === userId);
  }

  async recordBlockchainTransaction(data: any): Promise<BlockchainTransaction> {
    const id = randomUUID();
    const tx: BlockchainTransaction = {
      id,
      userId: data.userId,
      orderId: data.orderId,
      transactionHash: data.transactionHash,
      blockNumber: null,
      gasUsed: null,
      gasPrice: null,
      functionName: data.functionName,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.blockchainTransactions.set(id, tx);
    return tx;
  }

  async getBlockchainTransaction(txHash: string): Promise<BlockchainTransaction | undefined> {
    return Array.from(this.blockchainTransactions.values()).find((t) => t.transactionHash === txHash);
  }

  async createOrderBlockchain(data: any): Promise<OrderBlockchain> {
    const id = randomUUID();
    const orderBc: OrderBlockchain = {
      id,
      orderId: data.orderId,
      contractAddress: data.contractAddress,
      txHashCreated: data.txHashCreated,
      txHashAccepted: null,
      txHashShipped: null,
      txHashDelivered: null,
      escrowAmount: data.escrowAmount,
      escrowStatus: "locked",
      createdAt: new Date(),
    };
    this.orderBlockchain.set(id, orderBc);
    return orderBc;
  }

  async getOrderBlockchain(orderId: string): Promise<OrderBlockchain | undefined> {
    return Array.from(this.orderBlockchain.values()).find((o) => o.orderId === orderId);
  }
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  // OTP
  async storeOTP(email: string, code: string, expiresAt: Date): Promise<void> {
    await this.db.insert(otps).values({
      email,
      code,
      expiresAt,
      attempts: 0,
    });
  }

  async getOTP(email: string): Promise<{ code: string; expiresAt: Date; attempts: number } | undefined> {
    const result = await this.db.select().from(otps).where(eq(otps.email, email)).orderBy(desc(otps.createdAt)).limit(1);
    if (!result[0]) return undefined;
    return {
      code: result[0].code,
      expiresAt: result[0].expiresAt,
      attempts: result[0].attempts || 0,
    };
  }

  async incrementOTPAttempts(email: string): Promise<void> {
    const existing = await this.db.select().from(otps).where(eq(otps.email, email)).limit(1);
    if (existing[0]) {
      await this.db.update(otps).set({ attempts: (existing[0].attempts || 0) + 1 }).where(eq(otps.email, email));
    }
  }

  async clearOTP(email: string): Promise<void> {
    await this.db.delete(otps).where(eq(otps.email, email));
  }

  async verifySecurityAnswer(userId: string, answer: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.securityAnswer) return false;
    return user.securityAnswer.toLowerCase() === answer.toLowerCase();
  }

  async updateSecurityQuestion(userId: string, question: string, answer: string): Promise<void> {
    await this.updateUser(userId, { securityQuestion: question, securityAnswer: answer });
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductByProductId(productId: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.productId, productId)).limit(1);
    return result[0];
  }

  async listProducts(manufacturerId?: string): Promise<Product[]> {
    if (manufacturerId) {
      return await this.db.select().from(products).where(eq(products.manufacturerId, manufacturerId));
    }
    return await this.db.select().from(products);
  }

  async createProduct(product: any): Promise<Product> {
    const result = await this.db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await this.db.update(products).set(updates).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    const result = await this.db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);
    return result[0];
  }

  async listOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await this.db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async createOrder(order: any): Promise<Order> {
    const result = await this.db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await this.db.update(orders).set({ status: status as any }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async updateOrderWithCancellation(id: string, cancelReason: string, cancelDetails?: string): Promise<Order | undefined> {
    const result = await this.db.update(orders).set({
      status: "cancelled" as any,
      cancelReason,
      cancelDetails: cancelDetails || null,
      updatedAt: new Date()
    }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async getCustomerDashboardMetrics(customerId: string): Promise<{
    ordersPlaced: number;
    inTransit: number;
    shipped: number;
    delivered: number;
  }> {
    const customerOrders = await this.db.select().from(orders).where(and(
      eq(orders.customerId, customerId),
      // Exclude cancelled orders from the count
    ));

    const activeOrders = customerOrders.filter((o) => o.status !== "cancelled");

    return {
      ordersPlaced: activeOrders.length,
      inTransit: customerOrders.filter((o) => o.status === "confirmed").length,
      shipped: customerOrders.filter((o) => o.status === "shipped").length,
      delivered: customerOrders.filter((o) => o.status === "delivered").length,
    };
  }

  // Addresses
  async getAddress(id: string): Promise<Address | undefined> {
    const result = await this.db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return result[0];
  }

  async listAddressesByUser(userId: string): Promise<Address[]> {
    return await this.db.select().from(addresses).where(eq(addresses.userId, userId));
  }

  async createAddress(address: any): Promise<Address> {
    const result = await this.db.insert(addresses).values(address).returning();
    return result[0];
  }

  // Ratings
  async createRating(rating: any): Promise<any> {
    const result = await this.db.insert(ratings).values(rating).returning();
    return result[0];
  }

  async getRatingsByUser(userId: string): Promise<any[]> {
    return await this.db.select().from(ratings).where(eq(ratings.userId, userId));
  }

  async getAverageRating(): Promise<number> {
    const result = await this.db.select().from(ratings);
    if (result.length === 0) return 0;
    const sum = result.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
    return Number((sum / result.length).toFixed(1));
  }

  // Wishlist
  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const result = await this.db.insert(wishlist).values({ userId, productId }).returning();
    return result[0];
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await this.db.delete(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
  }

  async getWishlistByUser(userId: string): Promise<Wishlist[]> {
    return await this.db.select().from(wishlist).where(eq(wishlist.userId, userId));
  }

  // Support Conversations
  async createSupportConversation(customerId: string, subject?: string): Promise<SupportConversation> {
    const result = await this.db.insert(supportConversations).values({
      customerId,
      subject: subject || "Support Request",
      status: "open",
    }).returning();
    return result[0];
  }

  async getSupportConversation(id: string): Promise<SupportConversation | undefined> {
    const result = await this.db.select().from(supportConversations).where(eq(supportConversations.id, id)).limit(1);
    return result[0];
  }

  async listSupportConversationsByCustomer(customerId: string): Promise<SupportConversation[]> {
    return await this.db.select().from(supportConversations).where(eq(supportConversations.customerId, customerId)).orderBy(desc(supportConversations.updatedAt));
  }

  async listAllSupportConversations(): Promise<SupportConversation[]> {
    return await this.db.select().from(supportConversations).orderBy(desc(supportConversations.updatedAt));
  }

  async updateSupportConversationStatus(id: string, status: string): Promise<SupportConversation | undefined> {
    const result = await this.db.update(supportConversations).set({ status, updatedAt: new Date() }).where(eq(supportConversations.id, id)).returning();
    return result[0];
  }

  // Chat Messages
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
    const result = await this.db.insert(chatMessages).values({
      conversationId,
      senderId,
      content,
      read: false,
    }).returning();

    await this.db.update(supportConversations).set({ updatedAt: new Date() }).where(eq(supportConversations.id, conversationId));

    return result[0];
  }

  async getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return await this.db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await this.db.update(chatMessages).set({ read: true }).where(
      and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.senderId, userId)
      )
    );
  }

  // Notifications
  async createNotification(userId: string, type: string, title: string, message: string, payload?: any): Promise<any> {
    const result = await this.db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      payload,
      read: false,
    }).returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<any[]> {
    return await this.db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<any | undefined> {
    const result = await this.db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId)).returning();
    return result[0];
  }

  // Get customers who ordered products from a manufacturer
  async listCustomersByManufacturer(manufacturerId: string): Promise<any[]> {
    // Get all products for this manufacturer
    const manuProducts = await this.db.select().from(products).where(eq(products.manufacturerId, manufacturerId));
    const productIds = manuProducts.map(p => p.productId);

    if (productIds.length === 0) return [];

    // Get all orders for these products
    const allOrders = await this.db.select().from(orders).where(
      inArray(orders.productId, productIds)
    );

    // Get unique customer IDs from orders
    const customerIds = Array.from(new Set(allOrders.map(o => o.customerId)));

    // Get user details for these users
    const customerMap = new Map<string, any>();
    for (const customerId of customerIds) {
      const user = await this.db.select().from(users).where(eq(users.id, customerId)).limit(1);
      if (user[0]) {
        const orderCount = allOrders.filter(o => o.customerId === customerId).length;
        customerMap.set(customerId, {
          id: customerId,
          name: user[0].username,
          email: user[0].email,
          totalOrders: orderCount,
          joinedDate: new Date(user[0].createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          status: 'active' as const,
        });
      }
    }

    return Array.from(customerMap.values());
  }

  // Get pending orders for a manufacturer's products
  async getManufacturerPendingOrders(manufacturerId: string): Promise<any[]> {
    // Get all products for this manufacturer
    const manuProducts = await this.db.select().from(products).where(eq(products.manufacturerId, manufacturerId));
    const productIds = manuProducts.map(p => p.productId);

    if (productIds.length === 0) return [];

    // Get all orders for these products with "placed" status (new orders)
    const allOrders = await this.db.select().from(orders);

    const pendingOrdersList = [];
    for (const order of allOrders) {
      if (productIds.includes(order.productId) && (order.status === "placed" || order.status === "in-transit")) {
        const product = await this.db.select().from(products).where(eq(products.productId, order.productId)).limit(1);
        const user = await this.db.select().from(users).where(eq(users.id, order.customerId)).limit(1);

        const totalPrice = (parseFloat(product[0]?.price || "0")) * order.quantity;

        pendingOrdersList.push({
          id: order.orderId,
          orderId: order.orderId,
          productName: product[0]?.name || "Unknown Product",
          productDescription: product[0]?.description || "",
          productPrice: product[0]?.price || 0,
          customerName: user[0]?.username || "Unknown Customer",
          customerEmail: user[0]?.email || "Unknown Email",
          quantity: order.quantity,
          totalPrice: totalPrice.toString(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: order.status,
          createdAt: order.createdAt,
        });
      }
    }

    return pendingOrdersList.slice(0, 10);
  }

  // Get all orders for manufacturer's products
  async getManufacturerAllOrders(manufacturerId: string): Promise<any[]> {
    const manuProducts = await this.db.select().from(products).where(eq(products.manufacturerId, manufacturerId));
    const productIds = manuProducts.map(p => p.productId);

    if (productIds.length === 0) return [];

    const allOrders = await this.db.select().from(orders);
    const allOrdersList = [];

    for (const order of allOrders) {
      if (productIds.includes(order.productId)) {
        const product = await this.db.select().from(products).where(eq(products.productId, order.productId)).limit(1);
        const user = await this.db.select().from(users).where(eq(users.id, order.customerId)).limit(1);
        const customerAddresses = await this.db.select().from(addresses).where(eq(addresses.userId, order.customerId));

        const totalPrice = (parseFloat(product[0]?.price || "0")) * order.quantity;

        // Get customer address or use shipping address from order
        let customerAddress = "N/A";
        if (customerAddresses.length > 0) {
          const addr = customerAddresses[0];
          customerAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
        }

        allOrdersList.push({
          id: order.orderId,
          productName: product[0]?.name || "Unknown Product",
          productPrice: product[0]?.price || 0,
          customerName: user[0]?.username || "Unknown Customer",
          customerEmail: user[0]?.email || "Unknown Email",
          customerAddress: customerAddress,
          quantity: order.quantity,
          totalPrice: totalPrice.toString(),
          status: order.status,
          createdAt: new Date(order.createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          orderId: order.orderId,
        });
      }
    }

    return allOrdersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get retailers who ordered products from a manufacturer
  async listRetailersByManufacturer(manufacturerId: string): Promise<any[]> {
    // Get all products for this manufacturer
    const manuProducts = await this.db.select().from(products).where(eq(products.manufacturerId, manufacturerId));
    const productIds = manuProducts.map(p => p.productId);

    if (productIds.length === 0) return [];

    // Get all orders for these products by retailers
    const allOrders = await this.db.select().from(orders).where(
      inArray(orders.productId, productIds)
    );

    // Get unique retailer user IDs from orders
    const retailerIds = Array.from(new Set(allOrders.map(o => o.customerId)));

    // Get retailer details for these users
    const retailerMap = new Map<string, any>();
    for (const retailerId of retailerIds) {
      const user = await this.db.select().from(users).where(eq(users.id, retailerId)).limit(1);
      if (user[0] && (user[0].role === 'retailer' || user[0].role === 'supplier')) {
        const orderCount = allOrders.filter(o => o.customerId === retailerId).length;
        retailerMap.set(retailerId, {
          id: retailerId,
          name: user[0].username,
          email: user[0].email,
          totalOrders: orderCount,
          joinedDate: new Date(user[0].createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          status: 'active' as const,
        });
      }
    }

    return Array.from(retailerMap.values());
  }

  // Suppliers
  async addSupplier(manufacturerId: string, supplier: any): Promise<any> {
    const supplierId = randomUUID();
    const manufacturerUser = await this.getUser(manufacturerId);

    if (!manufacturerUser) {
      throw new Error("Manufacturer not found");
    }

    // Store suppliers in user's bio as JSON array
    const bio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { suppliers: [] };
    if (!bio.suppliers) bio.suppliers = [];

    const newSupplier = {
      id: supplierId,
      ...supplier,
      createdAt: new Date().toISOString(),
    };

    bio.suppliers.push(newSupplier);
    await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });

    return newSupplier;
  }

  async getSuppliersByManufacturer(manufacturerId: string): Promise<any[]> {
    const manufacturerUser = await this.getUser(manufacturerId);

    if (!manufacturerUser || !manufacturerUser.bio) {
      return [];
    }

    try {
      const bio = JSON.parse(manufacturerUser.bio);
      return bio.suppliers || [];
    } catch {
      return [];
    }
  }

  async getSupplier(supplierId: string): Promise<any | undefined> {
    const allUsers = await this.getAllUsers();
    for (const user of allUsers) {
      if (user.role === "manufacturer" && user.bio) {
        try {
          const bio = JSON.parse(user.bio);
          if (bio.suppliers && Array.isArray(bio.suppliers)) {
            const supplier = bio.suppliers.find((s: any) => s.id === supplierId);
            if (supplier) return supplier;
          }
        } catch { }
      }
    }
    return undefined;
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    // This is a simplified implementation. In production, you'd query all users
    // For now, we'll just return since the actual deletion happens in routes
    return;
  }

  async assignOrderToSupplier(manufacturerId: string, supplierId: string, orderId: string, orderDetails: any): Promise<any> {
    const manufacturerUser = await this.getUser(manufacturerId);
    if (!manufacturerUser) throw new Error("Manufacturer not found");

    const supplierUser = await this.getUser(supplierId);
    const supplierEmail = supplierUser?.email;

    const bio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { suppliers: [] };
    if (!bio.assignedOrders) bio.assignedOrders = {};

    // Store by BOTH supplier ID and email for reliable retrieval
    if (!bio.assignedOrders[supplierId]) bio.assignedOrders[supplierId] = [];
    if (supplierEmail && !bio.assignedOrders[supplierEmail]) bio.assignedOrders[supplierEmail] = [];

    const assignment = {
      orderId,
      ...orderDetails,
      supplierId,
      supplierEmail,
      status: "pending",
      assignedAt: new Date().toISOString(),
    };

    bio.assignedOrders[supplierId].push(assignment);
    if (supplierEmail) bio.assignedOrders[supplierEmail].push(assignment);

    await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });
    console.log(`✅ Order ${orderId} assigned to supplier ${supplierId} (${supplierEmail})`);

    return assignment;
  }

  async acceptOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void> {
    const manufacturerUser = await this.getUser(manufacturerId);
    if (!manufacturerUser) throw new Error("Manufacturer not found");

    const bio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { suppliers: [] };
    if (!bio.assignedOrders) return;

    // 1. Race Condition Check: Check if order is already accepted by ANYONE
    let alreadyAccepted = false;
    Object.keys(bio.assignedOrders).forEach(key => {
      const orders = bio.assignedOrders[key];
      if (Array.isArray(orders)) {
        const accepted = orders.find((o: any) => o.orderId === orderId && o.status === "accepted");
        if (accepted) alreadyAccepted = true;
      }
    });

    if (alreadyAccepted) {
      throw new Error("Order has already been accepted by another supplier");
    }

    const updateOrderStatus = (orders: any[]) => {
      for (const order of orders) {
        if (order.orderId === orderId) {
          order.status = "accepted";
          order.updatedAt = new Date();
          return true;
        }
      }
      return false;
    };

    // Try to find and update in supplierId key
    let found = false;
    if (bio.assignedOrders[supplierId]) {
      if (updateOrderStatus(bio.assignedOrders[supplierId])) {
        found = true;
      }
    }

    // Try to find and update in supplier email key
    const supplierUser = await this.getUser(supplierId);
    const supplierEmail = supplierUser?.email;
    if (!found && supplierEmail && bio.assignedOrders[supplierEmail]) {
      if (updateOrderStatus(bio.assignedOrders[supplierEmail])) {
        found = true;
      }
    }

    if (found) {
      // Remove this order from all OTHER suppliers who have it assigned
      for (const key of Object.keys(bio.assignedOrders)) {
        // Skip the supplier who just accepted it
        if (key === supplierId || key === supplierEmail) continue;

        const orders = bio.assignedOrders[key];
        if (Array.isArray(orders)) {
          bio.assignedOrders[key] = orders.filter((o: any) => o.orderId !== orderId);
        }
      }

      await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });

      // Update main orders table as well
      await this.updateOrderStatus(orderId, "accepted");

      console.log(`✅ Order ${orderId} accepted by supplier ${supplierId}, removed from all other suppliers`);
    } else {
      throw new Error("Order not found or already removed");
    }
  }

  async declineOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void> {
    const manufacturerUser = await this.getUser(manufacturerId);
    if (!manufacturerUser) throw new Error("Manufacturer not found");

    const bio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { suppliers: [] };
    if (!bio.assignedOrders) return;

    const removeOrder = (orders: any[]) => {
      return orders.filter(o => o.orderId !== orderId);
    };

    // Try to find and remove from supplierId key
    if (bio.assignedOrders[supplierId]) {
      bio.assignedOrders[supplierId] = removeOrder(bio.assignedOrders[supplierId]);
    }

    // Try to find and remove from supplier email key
    const supplierUser = await this.getUser(supplierId);
    const supplierEmail = supplierUser?.email;
    if (supplierEmail && bio.assignedOrders[supplierEmail]) {
      bio.assignedOrders[supplierEmail] = removeOrder(bio.assignedOrders[supplierEmail]);
    }

    await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });
    console.log(`❌ Order ${orderId} declined by supplier ${supplierId}`);
  }

  async updateAssignedOrderStatus(manufacturerId: string, supplierId: string, orderId: string, newStatus: string): Promise<void> {
    const manufacturerUser = await this.getUser(manufacturerId);
    if (!manufacturerUser) throw new Error("Manufacturer not found");

    const bio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { suppliers: [] };
    if (!bio.assignedOrders) return;

    const updateOrderStatus = (orders: any[]) => {
      for (const order of orders) {
        if (order.orderId === orderId) {
          order.status = newStatus;
          return true;
        }
      }
      return false;
    };

    // UPDATE BOTH keys - don't use "if (!found &&)" check
    // Orders are duplicated under both supplierId and email keys, so we must update ALL copies
    let found = false;

    // Update by supplierId key
    if (bio.assignedOrders[supplierId]) {
      if (updateOrderStatus(bio.assignedOrders[supplierId])) {
        found = true;
      }
    }

    // ALWAYS try to update by supplier email key (not just "if !found")
    const supplierUser = await this.getUser(supplierId);
    const supplierEmail = supplierUser?.email;
    if (supplierEmail && bio.assignedOrders[supplierEmail]) {
      if (updateOrderStatus(bio.assignedOrders[supplierEmail])) {
        found = true;
      }
    }

    if (found) {
      await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });

      // Also update the customer's order in the orders table so they see the updated status in tracking
      const order = await this.getOrderByOrderId(orderId);
      if (order) {
        await this.updateOrderStatus(order.id, newStatus);
      }

      console.log(`✅ Order ${orderId} status updated to ${newStatus} (synced to BOTH bio keys and customer tracking)`);
    } else {
      console.log(`⚠️ Order ${orderId} not found in assigned orders for supplier ${supplierId} / ${supplierEmail}`);
    }
  }

  async getSupplierAssignedOrders(manufacturerId: string, supplierId: string): Promise<any[]> {
    const manufacturerUser = await this.getUser(manufacturerId);
    if (!manufacturerUser || !manufacturerUser.bio) return [];

    try {
      const bio = JSON.parse(manufacturerUser.bio);
      return bio.assignedOrders?.[supplierId] || [];
    } catch {
      return [];
    }
  }

  async getAssignedOrdersForSupplier(supplierId: string, statusFilter?: string): Promise<any[]> {
    try {
      // Get supplier details to search by email too
      const supplierUser = await this.getUser(supplierId);
      const supplierEmail = supplierUser?.email;

      const filterStatus = statusFilter;

      // Get all manufacturers and find orders assigned to this supplier
      const allUsers = await this.db.select().from(users);
      const allOrders: any[] = [];

      for (const user of allUsers) {
        if (user.role !== "manufacturer" || !user.bio) continue;

        try {
          const bio = JSON.parse(user.bio);
          const assignedOrdersObj = bio.assignedOrders || {};

          // Search by SUPPLIER ID first
          let orders = assignedOrdersObj[supplierId] || [];

          // If no orders found by ID, try searching by email
          if (orders.length === 0 && supplierEmail) {
            orders = assignedOrdersObj[supplierEmail] || [];
          }

          // Also search all keys and match any that contain this supplier
          if (orders.length === 0) {
            const keys = Object.keys(assignedOrdersObj);
            for (const key of keys) {
              const potentialOrders = assignedOrdersObj[key];
              if (Array.isArray(potentialOrders) && potentialOrders.length > 0) {
                // Check if any order has supplier reference matching this supplier
                const matchingOrders = potentialOrders.filter(o =>
                  o.supplierId === supplierId ||
                  o.supplierEmail === supplierEmail ||
                  o.supplierName === supplierUser?.username
                );
                if (matchingOrders.length > 0) {
                  orders = matchingOrders;
                  break;
                }
              }
            }
          }

          if (orders.length > 0) {
            for (const order of orders) {
              // Normalize status for comparison (case-insensitive)
              const orderStatus = order.status?.toLowerCase() || "";
              const filterLower = filterStatus ? filterStatus.toLowerCase() : "all";

              // If filter is "accepted", also include "shipped" and "delivered" orders
              const shouldInclude = filterLower === "all" ||
                orderStatus === filterLower ||
                (filterLower === "accepted" && (orderStatus === "shipped" || orderStatus === "delivered"));

              if (shouldInclude) {
                allOrders.push({
                  ...order,
                  manufacturerName: user.username,
                  manufacturerEmail: user.email,
                });
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing bio for manufacturer ${user.username}:`, e);
          continue;
        }
      }

      console.log(`📦 Total: Supplier ${supplierId} has ${allOrders.length} ${filterStatus} orders`);
      return allOrders;
    } catch (error) {
      console.error("Error fetching assigned orders:", error);
      return [];
    }
  }

  // Supplier Chat
  async sendSupplierMessage(manufacturerId: string, supplierId: string, senderName: string, content: string): Promise<any> {
    const manufacturerUser = await this.getUser(manufacturerId);
    const supplierUser = await this.getUser(supplierId);

    if (!manufacturerUser) {
      throw new Error("Manufacturer not found");
    }
    if (!supplierUser) {
      throw new Error("Supplier not found");
    }

    const message = {
      id: randomUUID(),
      senderId: manufacturerId,
      senderName,
      content,
      createdAt: new Date().toISOString(),
    };

    // Store in manufacturer's bio
    const manufacturerBio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { suppliers: [], chat: {} };
    if (!manufacturerBio.chat) manufacturerBio.chat = {};
    const chatKey = `${supplierId}`;
    if (!manufacturerBio.chat[chatKey]) manufacturerBio.chat[chatKey] = [];
    manufacturerBio.chat[chatKey].push(message);
    await this.updateUser(manufacturerId, { bio: JSON.stringify(manufacturerBio) });

    // Store in supplier's bio
    const supplierBio = supplierUser.bio ? JSON.parse(supplierUser.bio) : { supplierChat: {} };
    if (!supplierBio.supplierChat) supplierBio.supplierChat = {};
    if (!supplierBio.supplierChat[manufacturerId]) supplierBio.supplierChat[manufacturerId] = [];
    supplierBio.supplierChat[manufacturerId].push(message);
    await this.updateUser(supplierId, { bio: JSON.stringify(supplierBio) });

    return message;
  }

  async getSupplierChatMessages(manufacturerId: string, supplierId: string): Promise<any[]> {
    const manufacturerUser = await this.getUser(manufacturerId);

    if (!manufacturerUser || !manufacturerUser.bio) {
      return [];
    }

    try {
      const bio = JSON.parse(manufacturerUser.bio);
      const chatKey = `${supplierId}`;
      return bio.chat?.[chatKey] || [];
    } catch {
      return [];
    }
  }

  // Manufacturers (for suppliers)
  async addManufacturer(supplierId: string, manufacturer: any): Promise<any> {
    const supplierUser = await this.getUser(supplierId);

    if (!supplierUser) {
      throw new Error("Supplier not found");
    }

    const bio = supplierUser.bio ? JSON.parse(supplierUser.bio) : { manufacturers: [] };
    if (!bio.manufacturers) bio.manufacturers = [];

    const newManufacturer = {
      id: randomUUID(),
      ...manufacturer,
      createdAt: new Date().toISOString(),
    };

    bio.manufacturers.push(newManufacturer);
    console.log(`[MemStorage] Adding manufacturer to bio. New count: ${bio.manufacturers.length}`);
    await this.updateUser(supplierId, { bio: JSON.stringify(bio) });

    return newManufacturer;
  }

  async getManufacturersBySupplier(supplierId: string): Promise<any[]> {
    const supplierUser = await this.getUser(supplierId);

    if (!supplierUser || !supplierUser.bio) {
      return [];
    }

    try {
      const bio = JSON.parse(supplierUser.bio);
      return bio.manufacturers || [];
    } catch {
      return [];
    }
  }

  async deleteManufacturer(manufacturerId: string): Promise<void> {
    // This is a simplified implementation. In production, you'd query all users
    // For now, we'll just return since the actual deletion happens in routes
    return;
  }

  // Manufacturer Chat (supplier to manufacturer)
  async sendManufacturerMessage(supplierId: string, manufacturerId: string, senderName: string, content: string): Promise<any> {
    const supplierUser = await this.getUser(supplierId);
    const manufacturerUser = await this.getUser(manufacturerId);

    if (!supplierUser) {
      throw new Error("Supplier not found");
    }
    if (!manufacturerUser) {
      throw new Error("Manufacturer not found");
    }

    const message = {
      id: randomUUID(),
      senderId: supplierId,
      senderName,
      content,
      createdAt: new Date().toISOString(),
    };

    // Store in supplier's bio
    const supplierBio = supplierUser.bio ? JSON.parse(supplierUser.bio) : { manufacturerChat: {} };
    if (!supplierBio.manufacturerChat) supplierBio.manufacturerChat = {};
    const chatKey = manufacturerId;
    if (!supplierBio.manufacturerChat[chatKey]) supplierBio.manufacturerChat[chatKey] = [];
    supplierBio.manufacturerChat[chatKey].push(message);
    await this.updateUser(supplierId, { bio: JSON.stringify(supplierBio) });

    // Store in manufacturer's bio
    const manufacturerBio = manufacturerUser.bio ? JSON.parse(manufacturerUser.bio) : { supplierChat: {} };
    if (!manufacturerBio.supplierChat) manufacturerBio.supplierChat = {};
    if (!manufacturerBio.supplierChat[supplierId]) manufacturerBio.supplierChat[supplierId] = [];
    manufacturerBio.supplierChat[supplierId].push(message);
    await this.updateUser(manufacturerId, { bio: JSON.stringify(manufacturerBio) });

    return message;
  }

  async getManufacturerChatMessages(supplierId: string, manufacturerId: string): Promise<any[]> {
    const supplierUser = await this.getUser(supplierId);

    if (!supplierUser || !supplierUser.bio) {
      return [];
    }

    try {
      const bio = JSON.parse(supplierUser.bio);
      const chatKey = manufacturerId;
      return bio.manufacturerChat?.[chatKey] || [];
    } catch {
      return [];
    }
  }

  // Blockchain methods
  async connectUserWallet(userId: string, walletAddress: string, chainId: number): Promise<UserWallet> {
    const wallet: UserWallet = {
      id: randomUUID(),
      userId,
      walletAddress,
      chainId,
      verifiedAt: new Date(),
      isDefault: true,
      createdAt: new Date(),
    };
    return wallet;
  }

  async getUserWallet(userId: string): Promise<UserWallet | undefined> {
    return undefined;
  }

  async recordBlockchainTransaction(data: any): Promise<BlockchainTransaction> {
    const tx: BlockchainTransaction = {
      id: randomUUID(),
      userId: data.userId,
      orderId: data.orderId,
      transactionHash: data.transactionHash,
      blockNumber: null,
      gasUsed: null,
      gasPrice: null,
      functionName: data.functionName,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return tx;
  }

  async getBlockchainTransaction(txHash: string): Promise<BlockchainTransaction | undefined> {
    return undefined;
  }

  async createOrderBlockchain(data: any): Promise<OrderBlockchain> {
    const orderBc: OrderBlockchain = {
      id: randomUUID(),
      orderId: data.orderId,
      contractAddress: data.contractAddress,
      txHashCreated: data.txHashCreated,
      txHashAccepted: null,
      txHashShipped: null,
      txHashDelivered: null,
      escrowAmount: data.escrowAmount,
      escrowStatus: "locked",
      createdAt: new Date(),
    };
    return orderBc;
  }

  async getOrderBlockchain(orderId: string): Promise<OrderBlockchain | undefined> {
    return undefined;
  }
}

import { MongoStorage } from "./mongo-storage";
import mongoose from "mongoose";

export let storage: IStorage;

const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;

console.log("--- STORAGE SETUP ---");
console.log("Database URL present:", !!dbUrl);

if (dbUrl) {
  console.log("Attempting to connect to MongoDB...");
  mongoose.connect(dbUrl)
    .then(() => console.log("✅ [STORAGE] Connected to MongoDB"))
    .catch((err) => {
      console.error("❌ [STORAGE] MongoDB connection error:", err);
      console.log("⚠️ [STORAGE] Falling back to Memory Storage due to error.");
      storage = new MemStorage();
    });
  storage = new MongoStorage();
  console.log("✅ [STORAGE] Selected: MongoStorage");
} else {
  console.log("⚠️ [STORAGE] No Database URL found. Selected: MemStorage (Data will be lost on restart)");
  storage = new MemStorage();
}
