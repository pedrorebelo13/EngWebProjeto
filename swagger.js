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
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      },
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
      Docente: {
        type: 'object',
        required: ['nome', 'categoria', 'filiacao', 'email'],
        properties: {
          nome: { type: 'string' },
          foto: { type: 'string' },
          categoria: { type: 'string' },
          filiacao: { type: 'string' },
          email: { type: 'string', format: 'email' },
          webpage: { type: 'string' }
        }
      },
      Horario: {
        type: 'object',
        properties: {
          teoricas: {
            type: 'array',
            items: { type: 'string' }
          },
          praticas: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      Datas: {
        type: 'object',
        properties: {
          teste: { type: 'string' },
          exame: { type: 'string' },
          projeto: { type: 'string' }
        }
      },
      Aula: {
        type: 'object',
        required: ['tipo', 'data', 'sumario'],
        properties: {
          tipo: { type: 'string' },
          data: { type: 'string' },
          sumario: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        }
      },
      Website: {
        type: 'object',
        required: ['tipo', 'corPrincipal'],
        properties: {
          tipo: { type: 'string' },
          corPrincipal: { type: 'string' }
        }
      },
      UserRegister: {
        type: 'object',
        required: ['username', 'name', 'email', 'password'],
        properties: {
          username: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          filiacao: { type: 'string' },
          password: { type: 'string', format: 'password' },
          role: { type: 'string', enum: ['docente', 'aluno'] }
        }
      },
      UserLogin: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string' },
          password: { type: 'string', format: 'password' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          token: { type: 'string' },
          apiKey: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              filiacao: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'docente', 'aluno'] }
            }
          }
        }
      },
      Uc: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sigla: { type: 'string' },
          titulo: { type: 'string' },
          ano: { type: 'integer' },
          createdBy: { type: 'string' },
          isPublic: { type: 'boolean' },
          docentes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Docente' }
          },
          horario: { $ref: '#/components/schemas/Horario' },
          avaliacao: {
            type: 'array',
            items: { type: 'string' }
          },
          datas: { $ref: '#/components/schemas/Datas' },
          aulas: {
            type: 'array',
            items: { $ref: '#/components/schemas/Aula' }
          },
          website: { $ref: '#/components/schemas/Website' }
        }
      },
      UcInput: {
        type: 'object',
        required: ['sigla', 'titulo', 'ano'],
        properties: {
          sigla: { type: 'string' },
          titulo: { type: 'string' },
          ano: { type: 'integer' },
          isPublic: { type: 'boolean' },
          docentes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Docente' }
          },
          horario: { $ref: '#/components/schemas/Horario' },
          avaliacao: {
            type: 'array',
            items: { type: 'string' }
          },
          datas: { $ref: '#/components/schemas/Datas' },
          aulas: {
            type: 'array',
            items: { $ref: '#/components/schemas/Aula' }
          },
          website: { $ref: '#/components/schemas/Website' }
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
