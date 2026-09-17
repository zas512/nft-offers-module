import "dotenv/config";
import express from "express";
import process from "node:process";
import { connectDb } from "./src/config/db.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import { logger, requestFlowLogger } from "./src/utils/logger.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(requestFlowLogger);
app.use(notFoundHandler);
app.use(errorHandler);

try {
  await connectDb();
  app.listen(5000, () => {
    logger.info("Server running on http://localhost:5000");
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
