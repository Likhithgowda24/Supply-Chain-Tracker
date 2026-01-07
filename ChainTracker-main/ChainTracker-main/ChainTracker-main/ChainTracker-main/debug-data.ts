
import "dotenv/config";
import mongoose from "mongoose";
import { MongoStorage } from "./server/mongo-storage";
import { User } from "./server/models";

async function testDataPersistence() {
    console.log("--- MongoDB Persistence Diagnostic ---");

    const url = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!url) {
        console.error("❌ No Connection URL found in .env");
        process.exit(1);
    }

    try {
        console.log("1. Connecting to MongoDB...");
        await mongoose.connect(url);
        console.log("✅ Connected.");

        console.log("2. Testing Direct Mongoose Write...");
        const testUsername = "debug_user_" + Date.now();
        const testUser = new User({
            username: testUsername,
            email: `${testUsername}@example.com`,
            role: "customer",
            verified: true
        });
        await testUser.save();
        console.log(`✅ Direct Write Success: Created user ${testUsername}`);

        console.log("3. Testing MongoStorage Class...");
        const storage = new MongoStorage();
        const retrievedUser = await storage.getUserByUsername(testUsername);

        if (retrievedUser && retrievedUser.username === testUsername) {
            console.log("✅ MongoStorage Read Success: Retrieved user correctly.");
        } else {
            console.error("❌ MongoStorage Read Failed: Could not find the user we just created.");
        }

        // Cleanup
        await User.deleteOne({ username: testUsername });
        console.log("4. Cleanup Done.");

        await mongoose.disconnect();
        process.exit(0);

    } catch (error: any) {
        console.error("❌ ERROR during data test:", error);
        process.exit(1);
    }
}

testDataPersistence();
