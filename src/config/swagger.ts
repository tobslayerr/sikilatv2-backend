import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';
import { ENV } from './env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIKILAT V2 API',
      version: '2.0.0',
      description: 'Dokumentasi Resmi API Sistem Informasi Laboratorium Terpadu (SIKILAT) SMPN 6 Pekalongan. Dibangun dengan Express.js, TypeScript, dan Prisma ORM.',
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}`,
        description: 'Server Lokal (Development)',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt_token',
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  // Swagger akan memindai anotasi JSDoc di semua file route
  apis: ['./src/routes/*.ts'], 
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Application) => {
  // UI Interaktif
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "SIKILAT API Docs",
  }));
  
  // Format JSON (Berguna jika ingin diexport ke Postman/Insomnia)
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};