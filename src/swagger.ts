import swaggerJsdoc from "swagger-jsdoc";
import { swaggerDefinition } from "./swaggerDefinition";

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [`**/*.routes.ts`, `**/*.routes.js`],
};

export const specs = swaggerJsdoc(options);
