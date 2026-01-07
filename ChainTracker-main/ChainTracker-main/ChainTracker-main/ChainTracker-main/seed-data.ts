
import "dotenv/config";
import mongoose from "mongoose";
import { User, Product, Order, Address, Rating } from "./server/models";
import { randomUUID } from "crypto";
import { hash } from "bcrypt";

async function seedData() {
    console.log("🌱 STARTING SEED PROCESS...");

    const url = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!url) {
        console.error("❌ No Database URL found.");
        process.exit(1);
    }

    try {
        await mongoose.connect(url);
        console.log("✅ Connected to MongoDB");

        // Clear existing simple data (optional, but good for demo)
        console.log("🧹 Cleaning old demo data...");
        await User.deleteMany({ username: { $in: ["demo_manufacturer", "demo_customer", "demo_supplier"] } });
        await Product.deleteMany({ manufacturerId: { $ne: null } }); // Careful with this in production!

        // Create Manufacturer
        const passwordHash = await hash("password123", 10);
        const mId = randomUUID();
        const manufacturer = await User.create({
            _id: mId,
            username: "demo_manufacturer",
            email: "manufacturer@demo.com",
            passwordHash,
            role: "manufacturer",
            verified: true,
            bio: "Leading supplier of premium tech components."
        });
        console.log("✅ Created Manufacturer: manufacturer@demo.com");

        // Create Customer
        const cId = randomUUID();
        const customer = await User.create({
            _id: cId,
            username: "demo_customer",
            email: "customer@demo.com",
            passwordHash,
            role: "customer",
            verified: true
        });
        console.log("✅ Created Customer: customer@demo.com");

        // Create Supplier
        const sId = randomUUID();
        const supplier = await User.create({
            _id: sId,
            username: "demo_supplier",
            email: "supplier@demo.com",
            passwordHash,
            role: "supplier",
            verified: true
        });
        console.log("✅ Created Supplier: supplier@demo.com");

        // Create Products
        const p1Id = randomUUID();
        const p2Id = randomUUID();

        await Product.insertMany([
            {
                _id: p1Id,
                productId: "PROD-001",
                name: "Quantum Processor X",
                description: "High-performance computing unit for next-gen servers.",
                price: 1200,
                stock: 50,
                manufacturerId: mId,
                image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80"
            },
            {
                _id: p2Id,
                productId: "PROD-002",
                name: "Nano-Fiber Circuit Board",
                description: "Ultra-durable, flexible motherboard component.",
                price: 450,
                stock: 200,
                manufacturerId: mId,
                image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80"
            }
        ]);
        console.log("✅ Created 2 Demo Products");

        // Create Orders
        await Order.create({
            orderId: "ORD-DEMO-001",
            customerId: cId,
            productId: p1Id,
            quantity: 2,
            totalPrice: 2400,
            status: "delivered",
            paymentStatus: "completed"
        });

        await Order.create({
            orderId: "ORD-DEMO-002",
            customerId: cId,
            productId: p2Id,
            quantity: 5,
            totalPrice: 2250,
            status: "in-transit",
            paymentStatus: "completed"
        });
        console.log("✅ Created 2 Demo Orders");

        console.log("\n✨ SEEDING COMPLETE! You can now log in.");
        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error("❌ Seed Error:", err);
        process.exit(1);
    }
}

seedData();
