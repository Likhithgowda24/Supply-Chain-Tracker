import { IStorage } from "./storage";
import { User, OTP, Product, Order, Shipment, ShipmentHistory, SupportConversation, ChatMessage, Notification, Address, Wishlist, Rating, UserWallet, BlockchainTransaction, OrderBlockchain } from "./models";
import { InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export class MongoStorage implements IStorage {
    // Users
    async getUser(id: string): Promise<any | undefined> {
        const user = await User.findOne({ _id: id });
        return user ? user.toObject() : undefined;
    }

    async getUserByUsername(username: string): Promise<any | undefined> {
        const user = await User.findOne({ username });
        return user ? user.toObject() : undefined;
    }

    async getUserByEmail(email: string): Promise<any | undefined> {
        const user = await User.findOne({ email });
        return user ? user.toObject() : undefined;
    }

    async createUser(insertUser: InsertUser): Promise<any> {
        const user = new User(insertUser);
        await user.save();
        return user.toObject();
    }

    async updateUser(id: string, updates: Partial<any>): Promise<any | undefined> {
        const user = await User.findOneAndUpdate({ _id: id }, updates, { new: true });
        return user ? user.toObject() : undefined;
    }

    async getAllUsers(): Promise<any[]> {
        const users = await User.find();
        return users.map(u => u.toObject());
    }

    // OTP
    async storeOTP(email: string, code: string, expiresAt: Date): Promise<void> {
        await OTP.create({ email, code, expiresAt });
    }

    async getOTP(email: string): Promise<{ code: string; expiresAt: Date; attempts: number } | undefined> {
        const otp = await OTP.findOne({ email }).sort({ createdAt: -1 });
        return otp ? { code: otp.code, expiresAt: otp.expiresAt, attempts: otp.attempts } : undefined;
    }

    async incrementOTPAttempts(email: string): Promise<void> {
        const otp = await OTP.findOne({ email }).sort({ createdAt: -1 });
        if (otp) {
            otp.attempts += 1;
            await otp.save();
        }
    }

    async clearOTP(email: string): Promise<void> {
        await OTP.deleteMany({ email });
    }

    // Security Questions
    async verifySecurityAnswer(userId: string, answer: string): Promise<boolean> {
        const user = await this.getUser(userId);
        return user?.securityAnswer === answer;
    }

    async updateSecurityQuestion(userId: string, question: string, answer: string): Promise<void> {
        await this.updateUser(userId, { securityQuestion: question, securityAnswer: answer });
    }

    // Products
    async getProduct(id: string): Promise<any | undefined> {
        const product = await Product.findOne({ _id: id });
        return product ? product.toObject() : undefined;
    }

    async getProductByProductId(productId: string): Promise<any | undefined> {
        const product = await Product.findOne({ productId });
        return product ? product.toObject() : undefined;
    }

    async listProducts(manufacturerId?: string): Promise<any[]> {
        const query = manufacturerId ? { manufacturerId } : {};
        const products = await Product.find(query);
        return products.map(p => p.toObject());
    }

    async createProduct(product: any): Promise<any> {
        try {
            const newProduct = new Product(product);
            await newProduct.save();
            return newProduct.toObject();
        } catch (error: any) {
            console.error("MongoStorage.createProduct error message:", error.message);
            if (error.errors) {
                console.error("MongoStorage.createProduct validation errors:", JSON.stringify(error.errors, null, 2));
            }
            throw error;
        }
    }

    async updateProduct(id: string, updates: Partial<any>): Promise<any | undefined> {
        const product = await Product.findOneAndUpdate({ _id: id }, updates, { new: true });
        return product ? product.toObject() : undefined;
    }

    async deleteProduct(id: string): Promise<void> {
        await Product.deleteOne({ _id: id });
    }

    // Orders
    async getOrder(id: string): Promise<any | undefined> {
        const order = await Order.findOne({ _id: id });
        return order ? order.toObject() : undefined;
    }

    async getOrderByOrderId(orderId: string): Promise<any | undefined> {
        const order = await Order.findOne({ orderId });
        return order ? order.toObject() : undefined;
    }

    async listOrdersByCustomer(customerId: string): Promise<any[]> {
        const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
        return orders.map(o => o.toObject());
    }

    async createOrder(order: any): Promise<any> {
        const newOrder = new Order(order);
        await newOrder.save();
        return newOrder.toObject();
    }

    async updateOrderStatus(id: string, status: string): Promise<any | undefined> {
        const order = await Order.findOneAndUpdate({ _id: id }, { status, updatedAt: new Date() }, { new: true });
        return order ? order.toObject() : undefined;
    }

    async updateOrderWithCancellation(id: string, cancelReason: string, cancelDetails?: string): Promise<any | undefined> {
        const order = await Order.findOneAndUpdate(
            { _id: id },
            { status: "cancelled", cancelReason, cancelDetails, updatedAt: new Date() },
            { new: true }
        );
        return order ? order.toObject() : undefined;
    }

    async getCustomerDashboardMetrics(customerId: string): Promise<{
        ordersPlaced: number;
        inTransit: number;
        shipped: number;
        delivered: number;
    }> {
        const orders = await Order.find({ customerId });
        return {
            ordersPlaced: orders.filter(o => o.status === "placed").length,
            inTransit: orders.filter(o => o.status === "in-transit").length,
            shipped: orders.filter(o => o.status === "shipped").length,
            delivered: orders.filter(o => o.status === "delivered").length,
        };
    }

    async listCustomersByManufacturer(manufacturerId: string): Promise<any[]> {
        // This is complex in Mongo without joins, but we can find products by manufacturer, then orders for those products, then unique customers
        const products = await Product.find({ manufacturerId });
        const productIds = products.map(p => p.productId);
        const orders = await Order.find({ productId: { $in: productIds } });
        const customerIds = [...new Set(orders.map(o => o.customerId))];
        const customers = await User.find({ _id: { $in: customerIds } });
        return customers.map(c => c.toObject());
    }

    async getManufacturerPendingOrders(manufacturerId: string): Promise<any[]> {
        const products = await Product.find({ manufacturerId });
        const productMap = new Map(products.map(p => [p.productId, p]));
        const productIds = products.map(p => p.productId);

        const orders = await Order.find({
            productId: { $in: productIds },
            status: { $in: ["placed", "confirmed", "in-transit", "shipped"] }
        }).sort({ createdAt: -1 });

        const results = [];
        for (const order of orders) {
            const product = productMap.get(order.productId);
            const customer = await User.findOne({ _id: order.customerId });
            if (product) {
                results.push({
                    ...order.toObject(),
                    productName: product.name,
                    productPrice: product.price,
                    productDescription: product.description,
                    customerName: customer?.username || "Unknown",
                    customerEmail: customer?.email || "Unknown",
                    dueDate: new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                });
            }
        }
        return results;
    }

    async getManufacturerAllOrders(manufacturerId: string): Promise<any[]> {
        const products = await Product.find({ manufacturerId });
        const productMap = new Map(products.map(p => [p.productId, p]));
        const productIds = products.map(p => p.productId);

        const orders = await Order.find({ productId: { $in: productIds } }).sort({ createdAt: -1 });

        const results = [];
        for (const order of orders) {
            const product = productMap.get(order.productId);
            const customer = await User.findOne({ _id: order.customerId });
            if (product) {
                results.push({
                    ...order.toObject(),
                    productName: product.name,
                    productPrice: product.price,
                    customerName: customer?.username || "Unknown",
                    customerEmail: customer?.email || "Unknown",
                });
            }
        }
        return results;
    }

    async listRetailersByManufacturer(manufacturerId: string): Promise<any[]> {
        const products = await Product.find({ manufacturerId });
        const productIds = products.map(p => p.productId);
        const orders = await Order.find({ productId: { $in: productIds } });

        const retailerStats = new Map<string, { totalOrders: number, totalRevenue: number, lastOrderDate: Date }>();
        const uniqueRetailerIds = new Set<string>();

        for (const order of orders) {
            uniqueRetailerIds.add(order.customerId);
            const current = retailerStats.get(order.customerId) || { totalOrders: 0, totalRevenue: 0, lastOrderDate: new Date(0) };
            current.totalOrders++;
            current.totalRevenue += Number(order.totalPrice);
            if (order.createdAt > current.lastOrderDate) {
                current.lastOrderDate = order.createdAt;
            }
            retailerStats.set(order.customerId, current);
        }

        const retailers = [];
        for (const retailerId of uniqueRetailerIds) {
            const user = await User.findOne({ _id: retailerId });
            const stats = retailerStats.get(retailerId);
            if (user && stats) {
                retailers.push({
                    id: user._id,
                    name: user.username,
                    email: user.email,
                    location: "Unknown",
                    totalOrders: stats.totalOrders,
                    totalRevenue: stats.totalRevenue,
                    status: "Active",
                    lastOrderDate: stats.lastOrderDate
                });
            }
        }
        return retailers;
    }

    // Addresses
    async getAddress(id: string): Promise<any | undefined> {
        const address = await Address.findOne({ _id: id });
        return address ? address.toObject() : undefined;
    }

    async listAddressesByUser(userId: string): Promise<any[]> {
        const addresses = await Address.find({ userId });
        return addresses.map(a => a.toObject());
    }

    async createAddress(address: any): Promise<any> {
        if (address.isDefault) {
            await Address.updateMany({ userId: address.userId }, { isDefault: false });
        }
        const newAddress = new Address(address);
        await newAddress.save();
        return newAddress.toObject();
    }

    // Ratings
    async createRating(rating: any): Promise<any> {
        const newRating = new Rating(rating);
        await newRating.save();
        return newRating.toObject();
    }

    async getAverageRating(): Promise<number> {
        const result = await Rating.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" } } }]);
        return result[0]?.avg || 0;
    }

    // Wishlist
    async addToWishlist(userId: string, productId: string): Promise<any> {
        const exists = await Wishlist.findOne({ userId, productId });
        if (exists) return exists.toObject();
        const item = await Wishlist.create({ userId, productId });
        return item.toObject();
    }

    async removeFromWishlist(userId: string, productId: string): Promise<void> {
        await Wishlist.deleteOne({ userId, productId });
    }

    async getWishlistByUser(userId: string): Promise<any[]> {
        const items = await Wishlist.find({ userId });
        return items.map(i => i.toObject());
    }

    // Support Conversations
    async createSupportConversation(customerId: string, subject?: string): Promise<any> {
        const conversation = await SupportConversation.create({ customerId, subject });
        return conversation.toObject();
    }

    async getSupportConversation(id: string): Promise<any | undefined> {
        const conversation = await SupportConversation.findOne({ _id: id });
        return conversation ? conversation.toObject() : undefined;
    }

    async listSupportConversationsByCustomer(customerId: string): Promise<any[]> {
        const conversations = await SupportConversation.find({ customerId }).sort({ updatedAt: -1 });
        return conversations.map(c => c.toObject());
    }

    async listAllSupportConversations(): Promise<any[]> {
        const conversations = await SupportConversation.find().sort({ updatedAt: -1 });
        return conversations.map(c => c.toObject());
    }

    async updateSupportConversationStatus(id: string, status: string): Promise<any | undefined> {
        const conversation = await SupportConversation.findOneAndUpdate({ _id: id }, { status, updatedAt: new Date() }, { new: true });
        return conversation ? conversation.toObject() : undefined;
    }

    // Chat Messages
    async sendMessage(conversationId: string, senderId: string, content: string): Promise<any> {
        const message = await ChatMessage.create({ conversationId, senderId, content });
        await SupportConversation.updateOne({ _id: conversationId }, { updatedAt: new Date() });
        return message.toObject();
    }

    async getMessagesByConversation(conversationId: string): Promise<any[]> {
        const messages = await ChatMessage.find({ conversationId }).sort({ createdAt: 1 });
        return messages.map(m => m.toObject());
    }

    async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
        await ChatMessage.updateMany({ conversationId, senderId: { $ne: userId } }, { read: true });
    }

    // Notifications
    async createNotification(userId: string, type: string, title: string, message: string, payload?: any): Promise<any> {
        const notification = await Notification.create({ userId, type, title, message, payload });
        return notification.toObject();
    }

    async getNotificationsByUser(userId: string): Promise<any[]> {
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        return notifications.map(n => n.toObject());
    }

    async markNotificationAsRead(notificationId: string): Promise<any | undefined> {
        const notification = await Notification.findOneAndUpdate({ _id: notificationId }, { read: true }, { new: true });
        return notification ? notification.toObject() : undefined;
    }

    // Suppliers
    async addSupplier(manufacturerId: string, supplier: any): Promise<any> {
        // Storing in Manufacturer's bio
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer) return null;

        let bio: any = {};
        try { bio = manufacturer.bio ? JSON.parse(manufacturer.bio) : {}; } catch { }
        if (!bio.suppliers) bio.suppliers = [];

        // Check if exists
        if (!bio.suppliers.find((s: any) => s.id === supplier.id)) {
            bio.suppliers.push(supplier);
            await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });
        }
        return supplier;
    }

    async getSuppliersByManufacturer(manufacturerId: string): Promise<any[]> {
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer || !manufacturer.bio) return [];
        try {
            const bio = JSON.parse(manufacturer.bio);
            return bio.suppliers || [];
        } catch { return []; }
    }

    async getSupplier(supplierId: string): Promise<any | undefined> {
        // This is tricky as suppliers are stored inside manufacturer bios or as users
        // First check if it's a registered user
        const user = await this.getUser(supplierId);
        if (user && user.role === 'supplier') return user;

        // Otherwise search in all manufacturers (inefficient but matches MemStorage logic)
        const manufacturers = await User.find({ role: 'manufacturer' });
        for (const m of manufacturers) {
            try {
                const bio = JSON.parse(m.bio || '{}');
                const supplier = bio.suppliers?.find((s: any) => s.id === supplierId);
                if (supplier) return supplier;
            } catch { }
        }
        return undefined;
    }

    async deleteSupplier(supplierId: string): Promise<void> {
        // Remove from all manufacturers
        const manufacturers = await User.find({ role: 'manufacturer' });
        for (const m of manufacturers) {
            try {
                const bio = JSON.parse(m.bio || '{}');
                if (bio.suppliers) {
                    bio.suppliers = bio.suppliers.filter((s: any) => s.id !== supplierId);
                    await this.updateUser(m._id, { bio: JSON.stringify(bio) });
                }
            } catch { }
        }
    }

    // Supplier Chat
    async sendSupplierMessage(manufacturerId: string, supplierId: string, senderName: string, content: string): Promise<any> {
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer) return null;

        const message = {
            id: randomUUID(),
            senderId: manufacturerId, // or whoever is sending
            senderName,
            content,
            timestamp: new Date(),
            isMe: true // Context dependent, but following MemStorage pattern
        };

        let bio: any = {};
        try { bio = manufacturer.bio ? JSON.parse(manufacturer.bio) : {}; } catch { }

        // We need to store this somewhere. MemStorage used a separate map.
        // We can store it in bio for now or create a new collection.
        // Given the constraints, let's stick to bio to match MemStorage behavior for now.
        // Actually MemStorage used `this.supplierChatMessages`.
        // Let's use a new collection `ChatMessage` but with a specific conversation ID format?
        // Or just store in bio as it seems ephemeral/embedded.

        // Let's use the ChatMessage model but with a custom conversationId
        const conversationId = `${manufacturerId}_${supplierId}`;
        await ChatMessage.create({
            conversationId,
            senderId: manufacturerId, // Assuming manufacturer is sending for this method name? 
            // Wait, sendSupplierMessage in MemStorage:
            // "messages.push(newMessage); this.supplierChatMessages.set(key, messages);"
            // It doesn't specify sender.
            content,
            read: false
        });
        return message;
    }

    async getSupplierChatMessages(manufacturerId: string, supplierId: string): Promise<any[]> {
        const conversationId = `${manufacturerId}_${supplierId}`;
        const messages = await ChatMessage.find({ conversationId }).sort({ createdAt: 1 });
        return messages.map(m => ({
            id: m._id,
            content: m.content,
            senderId: m.senderId,
            timestamp: m.createdAt,
            isMe: m.senderId === manufacturerId // Approximation
        }));
    }

    // Manufacturers (for suppliers)
    async addManufacturer(supplierId: string, manufacturer: any): Promise<any> {
        const supplier = await this.getUser(supplierId);
        if (!supplier) return null;

        let bio: any = {};
        try { bio = supplier.bio ? JSON.parse(supplier.bio) : {}; } catch { }
        if (!bio.manufacturers) bio.manufacturers = [];

        if (!bio.manufacturers.find((m: any) => m.id === manufacturer.id)) {
            bio.manufacturers.push(manufacturer);
            await this.updateUser(supplierId, { bio: JSON.stringify(bio) });
        }
        return manufacturer;
    }

    async getManufacturersBySupplier(supplierId: string): Promise<any[]> {
        const supplier = await this.getUser(supplierId);
        if (!supplier || !supplier.bio) return [];
        try {
            const bio = JSON.parse(supplier.bio);
            return bio.manufacturers || [];
        } catch { return []; }
    }

    async deleteManufacturer(manufacturerId: string): Promise<void> {
        // Remove from all suppliers
        const suppliers = await User.find({ role: 'supplier' });
        for (const s of suppliers) {
            try {
                const bio = JSON.parse(s.bio || '{}');
                if (bio.manufacturers) {
                    bio.manufacturers = bio.manufacturers.filter((m: any) => m.id !== manufacturerId);
                    await this.updateUser(s._id, { bio: JSON.stringify(bio) });
                }
            } catch { }
        }
    }

    // Manufacturer Chat (supplier to manufacturer)
    async sendManufacturerMessage(supplierId: string, manufacturerId: string, senderName: string, content: string): Promise<any> {
        const conversationId = `${manufacturerId}_${supplierId}`;
        const message = await ChatMessage.create({
            conversationId,
            senderId: supplierId,
            content,
            read: false
        });
        return message.toObject();
    }

    async getManufacturerChatMessages(supplierId: string, manufacturerId: string): Promise<any[]> {
        const conversationId = `${manufacturerId}_${supplierId}`;
        const messages = await ChatMessage.find({ conversationId }).sort({ createdAt: 1 });
        return messages.map(m => ({
            id: m._id,
            content: m.content,
            senderId: m.senderId,
            timestamp: m.createdAt,
            isMe: m.senderId === supplierId
        }));
    }

    // Assign Order
    async assignOrderToSupplier(manufacturerId: string, supplierId: string, orderId: string, orderDetails: any): Promise<void> {
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer) return;

        let bio: any = {};
        try { bio = manufacturer.bio ? JSON.parse(manufacturer.bio) : {}; } catch { }

        if (!bio.assignedOrders) bio.assignedOrders = {};
        if (!Array.isArray(bio.assignedOrders[supplierId])) bio.assignedOrders[supplierId] = [];

        const exists = bio.assignedOrders[supplierId].some((o: any) => o.orderId === orderId);
        if (!exists) {
            bio.assignedOrders[supplierId].push({
                ...orderDetails,
                assignedAt: new Date(),
                status: "pending_acceptance"
            });
            await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });
        }
    }

    async getSupplierAssignedOrders(manufacturerId: string, supplierId: string): Promise<any[]> {
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer || !manufacturer.bio) return [];
        try {
            const bio = JSON.parse(manufacturer.bio);
            return bio.assignedOrders?.[supplierId] || [];
        } catch { return []; }
    }

    async getAssignedOrdersForSupplier(supplierId: string, statusFilter?: string): Promise<any[]> {
        const orders: any[] = [];
        const manufacturers = await User.find({ role: 'manufacturer' });

        for (const user of manufacturers) {
            if (user.bio) {
                try {
                    const bio = JSON.parse(user.bio);
                    const assigned = bio.assignedOrders?.[supplierId];
                    if (assigned && Array.isArray(assigned)) {
                        assigned.forEach((order: any) => {
                            if (!statusFilter || order.status === statusFilter || (statusFilter === 'pending' && order.status === 'placed')) {
                                orders.push({
                                    ...order,
                                    manufacturerId: user._id,
                                    manufacturerName: user.username,
                                    manufacturerEmail: user.email
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
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer || !manufacturer.bio) return;

        try {
            const bio = JSON.parse(manufacturer.bio);
            if (!bio.assignedOrders) return;

            // Race condition check
            let alreadyAccepted = false;
            Object.keys(bio.assignedOrders).forEach(sId => {
                const orders = bio.assignedOrders[sId];
                if (Array.isArray(orders)) {
                    const acceptedOrder = orders.find((o: any) => o.orderId === orderId && o.status === "accepted");
                    if (acceptedOrder) alreadyAccepted = true;
                }
            });

            if (alreadyAccepted) throw new Error("Order has already been accepted by another supplier");

            // Accept for current supplier
            if (bio.assignedOrders[supplierId]) {
                const orderIndex = bio.assignedOrders[supplierId].findIndex((o: any) => o.orderId === orderId);
                if (orderIndex !== -1) {
                    bio.assignedOrders[supplierId][orderIndex].status = "accepted";
                    bio.assignedOrders[supplierId][orderIndex].updatedAt = new Date();
                }
            }

            // Remove from others
            Object.keys(bio.assignedOrders).forEach(sId => {
                if (sId !== supplierId && Array.isArray(bio.assignedOrders[sId])) {
                    bio.assignedOrders[sId] = bio.assignedOrders[sId].filter((o: any) => o.orderId !== orderId);
                }
            });

            await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });

            // Update MAIN order
            await Order.updateOne({ orderId }, { status: "accepted", updatedAt: new Date() });

        } catch (e) { throw e; }
    }

    async updateAssignedOrderStatus(manufacturerId: string, supplierId: string, orderId: string, status: string): Promise<void> {
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer || !manufacturer.bio) return;

        try {
            const bio = JSON.parse(manufacturer.bio);
            if (bio.assignedOrders?.[supplierId]) {
                const orderIndex = bio.assignedOrders[supplierId].findIndex((o: any) => o.orderId === orderId);
                if (orderIndex !== -1) {
                    bio.assignedOrders[supplierId][orderIndex].status = status;
                    bio.assignedOrders[supplierId][orderIndex].updatedAt = new Date();
                    await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });

                    // Sync to MAIN order
                    await Order.updateOne({ orderId }, { status, updatedAt: new Date() });
                }
            }
        } catch { }
    }

    async declineOrder(manufacturerId: string, supplierId: string, orderId: string): Promise<void> {
        const manufacturer = await this.getUser(manufacturerId);
        if (!manufacturer || !manufacturer.bio) return;

        try {
            const bio = JSON.parse(manufacturer.bio);
            if (bio.assignedOrders?.[supplierId]) {
                bio.assignedOrders[supplierId] = bio.assignedOrders[supplierId].filter((o: any) => o.orderId !== orderId);
                await this.updateUser(manufacturerId, { bio: JSON.stringify(bio) });
            }
        } catch { }
    }

    // Blockchain
    async connectUserWallet(userId: string, walletAddress: string, chainId: number): Promise<any> {
        const wallet = await UserWallet.create({ userId, walletAddress, chainId, verifiedAt: new Date(), isDefault: true });
        return wallet.toObject();
    }

    async getUserWallet(userId: string): Promise<any | undefined> {
        const wallet = await UserWallet.findOne({ userId });
        return wallet ? wallet.toObject() : undefined;
    }

    async recordBlockchainTransaction(data: any): Promise<any> {
        const tx = new BlockchainTransaction(data);
        await tx.save();
        return tx.toObject();
    }

    async getBlockchainTransaction(txHash: string): Promise<any | undefined> {
        const tx = await BlockchainTransaction.findOne({ transactionHash: txHash });
        return tx ? tx.toObject() : undefined;
    }

    async createOrderBlockchain(data: any): Promise<any> {
        const ob = new OrderBlockchain(data);
        await ob.save();
        return ob.toObject();
    }

    async getOrderBlockchain(orderId: string): Promise<any | undefined> {
        const ob = await OrderBlockchain.findOne({ orderId });
        return ob ? ob.toObject() : undefined;
    }
}
