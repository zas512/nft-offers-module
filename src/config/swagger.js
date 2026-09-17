import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    info: {
      title: "NFT Offers API"
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: ""
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}
