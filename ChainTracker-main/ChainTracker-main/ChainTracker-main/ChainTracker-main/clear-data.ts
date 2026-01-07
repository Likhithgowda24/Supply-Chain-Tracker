
import "dotenv/config";
import mongoose from "mongoose";
import { User, Product, Order } from "./server/models";

async function clearDemoData() {
    console.log("🧹 STARTING CLEANUP...");

    const url = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!url) {
        console.error("❌ No Database URL found.");
        process.exit(1);
    }

    try {
        await mongoose.connect(url);
        console.log("✅ Connected to MongoDB");

        // Delete users with specific usernames
        const demoUsernames = ["demo_manufacturer", "demo_customer", "demo_supplier"];
        const users = await User.find({ username: { $in: demoUsernames } });
        const userIds = users.map(u => u._id);

        if (userIds.length > 0) {
            console.log(`Found ${userIds.length} demo users.`);

            // Delete related orders
            const orderDeleteResult = await Order.deleteMany({
                $or: [
                    { customerId: { $in: userIds } },
                    { manufacturerId: { $in: userIds } } // If orders had this field directly
                ]
            });
            console.log(`🗑️ Deleted ${orderDeleteResult.deletedCount} orders.`);

            // Delete related products
            const productDeleteResult = await Product.deleteMany({ manufacturerId: { $in: userIds } });
            console.log(`🗑️ Deleted ${productDeleteResult.deletedCount} products.`);

            // Delete the users
            const userDeleteResult = await User.deleteMany({ _id: { $in: userIds } });
            console.log(`🗑️ Deleted ${userDeleteResult.deletedCount} users.`);

        } else {
            console.log("ℹ️ No demo users found to delete.");
        }

        console.log("\n✨ CLEANUP COMPLETE! The database is now free of demo data.");
        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error("❌ Cleanup Error:", err);
        process.exit(1);
    }
}

clearDemoData();
