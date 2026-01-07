
import "dotenv/config";
import mongoose from "mongoose";

async function listDatabases() {
    console.log("--- MongoDB Database Inspector ---");

    const url = process.env.DATABASE_URL || process.env.MONGODB_URI || "mongodb://localhost:27017";
    // Strip database name to connect to admin/root
    const rootUrl = url.split('/').slice(0, 3).join('/') + '/';

    console.log(`Checking connection to: ${rootUrl}`);

    try {
        const conn = await mongoose.connect(rootUrl);

        // Use the native admin interface to list databases
        const admin = conn.connection.db.admin();
        const result = await admin.listDatabases();

        console.log("\n📂 FOUND DATABASES:");
        for (const dbInfo of result.databases) {
            console.log(`   - ${dbInfo.name}  (Size: ${dbInfo.sizeOnDisk} bytes)`);

            // List collections for this db
            if (dbInfo.name !== 'admin' && dbInfo.name !== 'local' && dbInfo.name !== 'config') {
                try {
                    // Create a separate connection or switch db to inspect collections
                    const dbConn = conn.connection.useDb(dbInfo.name);
                    const collections = await dbConn.db.listCollections().toArray();
                    console.log(`     Collections:`);
                    if (collections.length === 0) console.log("       (none)");
                    for (const col of collections) {
                        const count = await dbConn.collection(col.name).countDocuments();
                        console.log(`       • ${col.name} (Docs: ${count})`);
                    }
                } catch (e) {
                    console.log(`     (Could not list collections: ${e.message})`);
                }
            }
        }

        console.log("\n----------------------------------");
        await mongoose.disconnect();
        process.exit(0);

    } catch (error: any) {
        console.error("❌ Inspection Error:", error);
        process.exit(1);
    }
}

listDatabases();
