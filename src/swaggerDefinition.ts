import swaggerJSDoc from "swagger-jsdoc";

export const swaggerDefinition: swaggerJSDoc.Options["definition"] = {
  openapi: "3.0.0",
  info: {
    title: "API de Gerenciamento de Tarefas",
    version: "1.0.0",
    description: "API REST para gerenciamento de usuários e tarefas",
    contact: {
      name: "Suporte",
      email: "suporte@exemplo.com",
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: "Servidor de desenvolvimento",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          id: {
            type: "string",
            description: "ID único do usuário",
            example: "clg2hf3z10000abcd1234",
          },
          name: {
            type: "string",
            description: "Nome do usuário",
            example: "João Silva",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email do usuário",
            example: "joao@exemplo.com",
          },
          password: {
            type: "string",
            description: "Senha do usuário (não retornada nas respostas)",
            example: "senha123",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação do usuário",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data da última atualização do usuário",
          },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID único do usuário",
            example: "clg2hf3z10000abcd1234",
          },
          name: {
            type: "string",
            description: "Nome do usuário",
            example: "João Silva",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email do usuário",
            example: "joao@exemplo.com",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação do usuário",
          },
        },
      },
      Task: {
        type: "object",
        required: ["title", "priority", "status"],
        properties: {
          id: {
            type: "string",
            description: "ID único da tarefa",
            example: "clg2hf3z10001abcd5678",
          },
          title: {
            type: "string",
            description: "Título da tarefa",
            example: "Implementar API REST",
          },
          description: {
            type: "string",
            description: "Descrição detalhada da tarefa",
            example: "Criar endpoints para gerenciamento de tarefas",
          },
          priority: {
            type: "string",
            enum: ["BAIXA", "MEDIA", "ALTA"],
            description: "Prioridade da tarefa",
            example: "ALTA",
          },
          status: {
            type: "string",
            enum: ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"],
            description: "Status atual da tarefa",
            example: "EM_ANDAMENTO",
          },
          userId: {
            type: "string",
            description: "ID do usuário proprietário da tarefa",
            example: "clg2hf3z10000abcd1234",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criação da tarefa",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data da última atualização da tarefa",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Mensagem de erro",
            example: "Erro ao processar a solicitação",
          },
          details: {
            type: "object",
            description: "Detalhes do erro (opcional)",
          },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          user: {
            $ref: "#/components/schemas/UserResponse",
          },
          token: {
            type: "string",
            description: "Token JWT para autenticação",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
