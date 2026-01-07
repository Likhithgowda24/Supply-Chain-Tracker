
const SERVER_URL = "http://localhost:5001";

async function checkStorage() {
    console.log("🔍 Checking Server Storage Mode...");
    try {
        const response = await fetch(`${SERVER_URL}/api/debug/storage`);
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Server Status:", data);
            if (data.storageType === "MemStorage") {
                console.error("🚨 CRITICAL: Server is running in MEMORY MODE!");
                console.error("   This explains why data is not saving to MongoDB.");
            } else if (data.storageType === "MongoStorage") {
                console.log("✅ Server is correctly using MongoStorage.");
            }
        } else {
            console.log("⚠️ Debug route not found (404) or error.");
            console.log("   (You might need to restart the server for the new route to appear)");
        }
    } catch (e: any) {
        console.error("❌ Connection Failed:", e.cause || e.message);
    }
}

checkStorage();
