
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./server/models";

// We need to use 'http' to make a request to the running server
// But for simplicity, let's use 'fetch' (available in Node 18+)
// If not available, we'll use 'http' module

const SERVER_URL = "http://localhost:5001"; // Check package.json dev script port

async function testRegistration() {
    console.log("--- Signup Simulation Test ---");

    // 1. Define a test user
    const randomId = Math.floor(Math.random() * 10000);
    const testUser = {
        username: `test_user_${randomId}`,
        email: `test${randomId}@example.com`,
        password: "password123",
        role: "customer",
        securityQuestion: "What is your pet's name?",
        securityAnswer: "Fluffy"
    };

    console.log(`1. Attempting to register user: ${testUser.username}`);
    console.log(`   Target URL: ${SERVER_URL}/api/auth/signup`);

    try {
        // Make the HTTP POST request
        const response = await fetch(`${SERVER_URL}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(testUser)
        });

        if (response.status === 200 || response.status === 201) {
            console.log("✅ HTTP Request Success: Server returned OK.");
            const data = await response.json();
            console.log("   Server Response User ID:", data.user ? data.user.id : "unknown");

            // 2. Verify in MongoDB directly
            console.log("2. Verifying persistence in MongoDB...");
            const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;

            if (dbUrl) {
                await mongoose.connect(dbUrl);
                const savedUser = await User.findOne({ email: testUser.email });

                if (savedUser) {
                    console.log("✅ VERIFICATION SUCCESS: User found in MongoDB!");
                    console.log(`   ID: ${savedUser._id}`);
                    console.log(`   Email: ${savedUser.email}`);
                } else {
                    console.error("❌ VERIFICATION FAILED: User NOT found in MongoDB explicitly (but HTTP was OK).");
                    console.error("   This implies the server might be connected to a DIFFERENT database or InMemory storage.");
                }
                await mongoose.disconnect();
            } else {
                console.log("⚠️ Skipping direct DB verification (no URL in env).");
            }

        } else {
            console.error(`❌ HTTP Request Failed with status: ${response.status}`);
            const text = await response.text();
            console.error("   Response:", text);
        }

    } catch (error: any) {
        console.error("❌ CONNECTION ERROR: Could not reach the server.");
        console.error(`   Is the server running on ${SERVER_URL}?`);
        console.error("   Error details:", error.cause || error.message);
    }
}

testRegistration();
