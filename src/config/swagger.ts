import type { Application } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NFT Offers API Marketplace",
      version: "1.0.0"
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server"
      }
    ]
  },
  apis: ["./src/routes/*.ts", "./src/routes/*.js"]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Application): void {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}
