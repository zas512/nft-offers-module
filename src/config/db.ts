import mongoose, { type Connection } from "mongoose";

export class Database {
  private static instance: Database | null = null;
  private connection: Connection | null = null;
  private constructor() {}
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  public async connect(): Promise<Connection> {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI is missing from environment");
      process.exit(1);
    }
    if (this.connection && mongoose.connection.readyState === 1) {
      return this.connection;
    }
    try {
      await mongoose.connect(mongoUri);
      this.connection = mongoose.connection;
      console.log("Connected to MongoDB via Mongoose");
      return this.connection;
    } catch (err) {
      console.error("MongoDB connection failed:", err);
      throw err;
    }
  }

  public async close(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      this.connection = null;
      console.log("Disconnected from MongoDB");
    }
  }
}

export const database = Database.getInstance();
export const connectDb = () => database.connect();
export const closeDb = () => database.close();
export { mongoose };
