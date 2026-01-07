import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IUser extends Document {
    _id: any;
    username: string;
    email: string;
    passwordHash?: string;
    role: "customer" | "manufacturer" | "retailer" | "supplier" | "admin";
    avatar?: string;
    bio?: string;
    phone?: string;
    verified: boolean;
    securityQuestion?: string;
    securityAnswer?: string;
    createdAt: Date;
}

export interface IOTP extends Document {
    _id: any;
    email: string;
    code: string;
    expiresAt: Date;
    attempts: number;
    createdAt: Date;
}

export interface IProduct extends Document {
    _id: any;
    productId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    stock: number;
    image?: string;
    manufacturerId: string;
    createdAt: Date;
}

export interface IOrder extends Document {
    _id: any;
    orderId: string;
    customerId: string;
    productId: string;
    quantity: number;
    totalPrice: number;
    status: "placed" | "confirmed" | "shipped" | "in-transit" | "delivered" | "cancelled" | "accepted" | "pending_acceptance";
    paymentMethod?: "cod" | "online";
    paymentStatus: "pending" | "completed" | "failed";
    paymentId?: string;
    shippingAddress?: any;
    location?: any;
    cancelReason?: string;
    cancelDetails?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IShipment extends Document {
    _id: any;
    shipmentId: string;
    orderId: string;
    status: "pending" | "in-transit" | "delivered" | "delayed";
    currentLocation?: string;
    destination?: string;
    startLocation?: string;
    estimatedDelivery?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IShipmentHistory extends Document {
    _id: any;
    shipmentId: string;
    status: string;
    location?: string;
    txHash?: string;
    metadata?: any;
    createdAt: Date;
}

export interface ISupportConversation extends Document {
    _id: any;
    customerId: string;
    status: string;
    subject?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChatMessage extends Document {
    _id: any;
    conversationId: string;
    senderId: string;
    content: string;
    read: boolean;
    createdAt: Date;
}

export interface INotification extends Document {
    _id: any;
    userId: string;
    type: string;
    title?: string;
    message?: string;
    payload?: any;
    read: boolean;
    createdAt: Date;
}

export interface IAddress extends Document {
    _id: any;
    userId: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
    createdAt: Date;
}

export interface IWishlist extends Document {
    _id: any;
    userId: string;
    productId: string;
    createdAt: Date;
}

export interface IRating extends Document {
    _id: any;
    orderId?: string;
    productId: string;
    userId: string;
    rating: number;
    review?: string;
    createdAt: Date;
}

export interface IUserWallet extends Document {
    _id: any;
    userId: string;
    walletAddress: string;
    chainId: number;
    verifiedAt?: Date;
    isDefault: boolean;
    createdAt: Date;
}

export interface IBlockchainTransaction extends Document {
    _id: any;
    userId: string;
    orderId?: string;
    transactionHash: string;
    blockNumber?: number;
    gasUsed?: string;
    gasPrice?: string;
    functionName?: string;
    status: "pending" | "confirmed" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderBlockchain extends Document {
    _id: any;
    orderId: string;
    contractAddress?: string;
    txHashCreated?: string;
    txHashAccepted?: string;
    txHashShipped?: string;
    txHashDelivered?: string;
    escrowAmount?: number;
    escrowStatus: "locked" | "released" | "refunded";
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    _id: { type: String, default: () => randomUUID() },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["customer", "manufacturer", "retailer", "supplier", "admin"], default: "customer" },
    avatar: { type: String },
    bio: { type: String },
    phone: { type: String },
    verified: { type: Boolean, default: false },
    securityQuestion: { type: String },
    securityAnswer: { type: String },
    createdAt: { type: Date, default: Date.now },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

const OTPSchema = new Schema<IOTP>({
    _id: { type: String, default: () => randomUUID() },
    email: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const ProductSchema = new Schema<IProduct>({
    _id: { type: String, default: () => randomUUID() },
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String },
    stock: { type: Number, default: 0 },
    image: { type: String },
    manufacturerId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const OrderSchema = new Schema<IOrder>({
    _id: { type: String, default: () => randomUUID() },
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["placed", "confirmed", "shipped", "in-transit", "delivered", "cancelled"], default: "placed" },
    paymentMethod: { type: String, enum: ["cod", "online"] },
    paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    paymentId: { type: String },
    shippingAddress: { type: Schema.Types.Mixed },
    location: { type: Schema.Types.Mixed },
    cancelReason: { type: String },
    cancelDetails: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const ShipmentSchema = new Schema<IShipment>({
    _id: { type: String, default: () => randomUUID() },
    shipmentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    status: { type: String, enum: ["pending", "in-transit", "delivered", "delayed"], default: "pending" },
    currentLocation: { type: String },
    destination: { type: String },
    startLocation: { type: String },
    estimatedDelivery: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const ShipmentHistorySchema = new Schema<IShipmentHistory>({
    _id: { type: String, default: () => randomUUID() },
    shipmentId: { type: String, required: true },
    status: { type: String, required: true },
    location: { type: String },
    txHash: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
});

const SupportConversationSchema = new Schema<ISupportConversation>({
    _id: { type: String, default: () => randomUUID() },
    customerId: { type: String, required: true },
    status: { type: String, default: "open" },
    subject: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const ChatMessageSchema = new Schema<IChatMessage>({
    _id: { type: String, default: () => randomUUID() },
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const NotificationSchema = new Schema<INotification>({
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String },
    message: { type: String },
    payload: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const AddressSchema = new Schema<IAddress>({
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const WishlistSchema = new Schema<IWishlist>({
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const RatingSchema = new Schema<IRating>({
    _id: { type: String, default: () => randomUUID() },
    orderId: { type: String },
    productId: { type: String, required: true },
    userId: { type: String, required: true },
    rating: { type: Number, required: true },
    review: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const UserWalletSchema = new Schema<IUserWallet>({
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true, unique: true },
    chainId: { type: Number, default: 11155111 },
    verifiedAt: { type: Date },
    isDefault: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const BlockchainTransactionSchema = new Schema<IBlockchainTransaction>({
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true },
    orderId: { type: String },
    transactionHash: { type: String, required: true, unique: true },
    blockNumber: { type: Number },
    gasUsed: { type: String },
    gasPrice: { type: String },
    functionName: { type: String },
    status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const OrderBlockchainSchema = new Schema<IOrderBlockchain>({
    _id: { type: String, default: () => randomUUID() },
    orderId: { type: String, required: true, unique: true },
    contractAddress: { type: String },
    txHashCreated: { type: String },
    txHashAccepted: { type: String },
    txHashShipped: { type: String },
    txHashDelivered: { type: String },
    escrowAmount: { type: Number },
    escrowStatus: { type: String, enum: ["locked", "released", "refunded"], default: "locked" },
    createdAt: { type: Date, default: Date.now },
});

// Models
export const User = mongoose.model<IUser>("User", UserSchema);
export const OTP = mongoose.model<IOTP>("OTP", OTPSchema);
export const Product = mongoose.model<IProduct>("Product", ProductSchema);
export const Order = mongoose.model<IOrder>("Order", OrderSchema);
export const Shipment = mongoose.model<IShipment>("Shipment", ShipmentSchema);
export const ShipmentHistory = mongoose.model<IShipmentHistory>("ShipmentHistory", ShipmentHistorySchema);
export const SupportConversation = mongoose.model<ISupportConversation>("SupportConversation", SupportConversationSchema);
export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
export const Address = mongoose.model<IAddress>("Address", AddressSchema);
export const Wishlist = mongoose.model<IWishlist>("Wishlist", WishlistSchema);
export const Rating = mongoose.model<IRating>("Rating", RatingSchema);
export const UserWallet = mongoose.model<IUserWallet>("UserWallet", UserWalletSchema);
export const BlockchainTransaction = mongoose.model<IBlockchainTransaction>("BlockchainTransaction", BlockchainTransactionSchema);
export const OrderBlockchain = mongoose.model<IOrderBlockchain>("OrderBlockchain", OrderBlockchainSchema);
