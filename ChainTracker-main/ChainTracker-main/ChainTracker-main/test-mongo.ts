
import "dotenv/config";
import mongoose from "mongoose";

async function testConnection() {
  console.log("--- MongoDB Connection Diagnostic ---");
  console.log("1. Checking Environment Variables...");
  
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ ERROR: DATABASE_URL is NOT defined in process.env");
    console.error("   Make sure you have a .env file in the root directory.");
    process.exit(1);
  }
  
  console.log(`✅ DATABASE_URL found: ${url}`);
  
  console.log("2. Attempting to Connect to MongoDB...");
  try {
    await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ SUCCESS: Connected to MongoDB successfully!");
    console.log("   The database is running and accessible.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ ERROR: Could not connect to MongoDB.");
    console.error(`   Error Message: ${error.message}`);
    console.error("\n   Possible fixes:");
    console.error("   - Is the MongoDB Service running?");
    console.error("   - Did you install MongoDB as a Service?");
    process.exit(1);
  }
}

testConnection();
