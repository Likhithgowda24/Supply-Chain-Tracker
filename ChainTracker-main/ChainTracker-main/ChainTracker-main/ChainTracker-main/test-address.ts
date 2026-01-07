
import "dotenv/config";
import mongoose from "mongoose";
import { User, Address } from "./server/models";

const SERVER_URL = "http://localhost:5001";

async function testAddressStorage() {
    console.log("--- Address Storage Test ---");

    // 1. Create a User to attach address to
    const randomId = Math.floor(Math.random() * 10000);
    const testUser = {
        username: `addr_test_${randomId}`,
        email: `addr${randomId}@example.com`,
        password: "password123",
        role: "customer",
        securityQuestion: "q",
        securityAnswer: "a"
    };

    let userId: string = "";
    let token: string = "";

    try {
        // Signup
        console.log(`1. Registering user: ${testUser.username}`);
        const signupRes = await fetch(`${SERVER_URL}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testUser)
        });

        if (!signupRes.ok) {
            throw new Error(`Signup failed: ${signupRes.status} ${await signupRes.text()}`);
        }

        const signupData = await signupRes.json();
        userId = signupData.user.id;
        token = signupData.accessToken;
        console.log(`   User created. ID: ${userId}`);

        // 2. Add Address
        const testAddress = {
            street: "123 Blockchain Blvd",
            city: "Crypto City",
            state: "DeFi State",
            zipCode: "90210",
            country: "Web3 Land",
            isDefault: true
        };

        console.log("2. Sending POST /api/address...");
        const addrRes = await fetch(`${SERVER_URL}/api/address`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(testAddress)
        });

        if (!addrRes.ok) {
            throw new Error(`Address creation failed: ${addrRes.status} ${await addrRes.text()}`);
        }

        const addrData = await addrRes.json();
        console.log("   API Response:", addrData);

        // 3. Verify in MongoDB
        console.log("3. Verifying directly in MongoDB...");
        const url = process.env.DATABASE_URL || process.env.MONGODB_URI;
        if (url) {
            await mongoose.connect(url);

            // Check Address Collection
            const savedAddress = await Address.findOne({ userId: userId });
            if (savedAddress) {
                console.log("✅ VERIFICATION SUCCESS: Address found in 'addresses' collection!");
                console.log("   " + JSON.stringify(savedAddress.toObject(), null, 2));
            } else {
                console.error("❌ VERIFICATION FAILED: Address NOT found in 'addresses' collection.");
            }

            // Check User Collection (just in case user expects it there)
            const savedUser = await User.findById(userId);
            if (savedUser) {
                console.log("ℹ️ Checking User document...");
                // @ts-ignore
                if (savedUser.address || savedUser.shippingAddress) {
                    console.log("   (Address fields found on User document - unexpected but interesting)");
                } else {
                    console.log("   (No address fields directly on User document - this is normal per schema)");
                }
            }

            await mongoose.disconnect();
        } else {
            console.log("⚠️ Skipping DB check (no env URL)");
        }

    } catch (error: any) {
        console.error("❌ TEST FAILED:", error.message);
    }
}

testAddressStorage();
