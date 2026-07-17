const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const specs = swaggerJsDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DeployPilot AI API',
      version: '1.0.0',
      description: 'Production backend for DeployPilot AI'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['src/routes/*.js']
});

function mountSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = { mountSwagger };
