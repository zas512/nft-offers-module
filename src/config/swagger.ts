import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry
} from "@asteasolutions/zod-to-openapi";
import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "NFT Offers API",
      version: "1.0.0"
    },
    servers: [
      {
        url: "http://localhost:5000"
      }
    ]
  });
}

export function setupSwagger(app: Application): void {
  const openApiDoc = generateOpenApiDocument();
  app.get("/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiDoc);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDoc, {
      customSiteTitle: "NFT Offers API",
      customCss: `
        .curl-command,
        .curl,
        .request-url,
        .response-headers,
        .response-headers-wrapper,
        .responses-header,
        .request-duration,
        .response-duration,
        .response-col_links,
        table.responses-table:not(.live-responses-table),
        table.live-responses-table tr td.response-col_description > h5:not(:first-of-type),
        table.live-responses-table tr td.response-col_description > pre:not(:first-of-type),
        table.live-responses-table tr td.response-col_description > .response-headers,
        .response-col_description h5:nth-of-type(2),
        .response-col_description pre:nth-of-type(2) {
          display: none !important;
        }
      `,
      swaggerOptions: {
        docExpansion: "list",
        defaultModelsExpandDepth: -1,
        displayRequestDuration: false,
        tryItOutEnabled: true
      }
    })
  );
}
