import "dotenv/config";
import express from "express";
import process from "node:process";
import { connectDb } from "./src/config/db.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
app.disable("x-powered-by");
app.use(express.json());

try {
  await connectDb();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}