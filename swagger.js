const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EngWebProjeto API',
    version: '1.0.0',
    description: 'API documentation for EngWebProjeto'
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'UCs', description: 'UC management endpoints' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      UserRegister: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['user', 'admin'] }
            }
          }
        }
      },
      UcInput: {
        type: 'object',
        required: ['sigla', 'titulo', 'ano'],
        properties: {
          sigla: { type: 'string' },
          titulo: { type: 'string' },
          ano: { type: 'integer' }
        },
        additionalProperties: true
      }
    }
  },
  servers: [
    {
      url: 'http://localhost:16000',
      description: 'Local development'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js']
};

module.exports = swaggerJsdoc(options);
