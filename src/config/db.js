import { MongoClient } from "mongodb";

let client = null;
let db = null;

export async function connectDb() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing");
    process.exit(1);
  }
  if (client && db) {
    return db;
  }
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log("Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database is not connected.");
  }
  return db;
}
