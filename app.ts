import "dotenv/config";
import express from "express";
import process from "node:process";
import { connectDb } from "./src/config/db.js";
import { setupSwagger } from "./src/config/swagger.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import apiRoutes from "./src/routes/index.js";
import { logger, requestFlowLogger } from "./src/utils/logger.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.disable("x-powered-by");
app.use(express.json());
app.use(requestFlowLogger);
setupSwagger(app);
app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

try {
  await connectDb();
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Swagger documentation available at http://localhost:${PORT}/docs`);
  });
} catch (err) {
  logger.error("Failed to start server:", err);
  process.exit(1);
}

export default app;
