const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mini CRM Platform API",
      version: "1.0.0",
      description:
        "A comprehensive CRM platform with AI-powered segmentation and campaign management",
      contact: {
        name: "Mini CRM Team",
        email: "support@minicrm.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://your-production-domain.com/api"
            : "http://localhost:3000/api",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        googleOAuth: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
              tokenUrl: "https://oauth2.googleapis.com/token",
              scopes: {
                openid: "OpenID Connect",
                profile: "User profile information",
                email: "User email address",
              },
            },
          },
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            googleId: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            avatar: { type: "string" },
            role: { type: "string", enum: ["admin", "user"] },
            isActive: { type: "boolean" },
            preferences: {
              type: "object",
              properties: {
                timezone: { type: "string" },
                emailNotifications: { type: "boolean" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Customer: {
          type: "object",
          required: ["customerId", "name", "email"],
          properties: {
            customerId: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            totalSpending: { type: "number", minimum: 0 },
            totalVisits: { type: "number", minimum: 0 },
            lastVisit: { type: "string", format: "date-time" },
            registrationDate: { type: "string", format: "date-time" },
            segments: { type: "array", items: { type: "string" } },
            preferences: {
              type: "object",
              properties: {
                communicationChannel: {
                  type: "string",
                  enum: ["email", "sms", "both"],
                },
                language: { type: "string" },
              },
            },
            address: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
                zipCode: { type: "string" },
              },
            },
            isActive: { type: "boolean" },
          },
        },
        Order: {
          type: "object",
          required: [
            "orderId",
            "customerId",
            "amount",
            "items",
            "paymentMethod",
          ],
          properties: {
            orderId: { type: "string" },
            customerId: { type: "string" },
            amount: { type: "number", minimum: 0 },
            currency: { type: "string" },
            status: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "shipped",
                "delivered",
                "cancelled",
                "refunded",
              ],
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  productName: { type: "string" },
                  category: { type: "string" },
                  quantity: { type: "number", minimum: 1 },
                  unitPrice: { type: "number", minimum: 0 },
                  totalPrice: { type: "number", minimum: 0 },
                },
              },
            },
            paymentMethod: {
              type: "string",
              enum: [
                "credit_card",
                "debit_card",
                "upi",
                "net_banking",
                "cash_on_delivery",
              ],
            },
            orderDate: { type: "string", format: "date-time" },
          },
        },
        Segment: {
          type: "object",
          required: ["name", "ruleGroups"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            ruleGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  logic: { type: "string", enum: ["AND", "OR"] },
                  rules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        operator: { type: "string" },
                        value: {},
                        dataType: {
                          type: "string",
                          enum: ["number", "string", "date", "array"],
                        },
                      },
                    },
                  },
                },
              },
            },
            naturalLanguageQuery: { type: "string" },
            audienceSize: { type: "number" },
            isActive: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        Campaign: {
          type: "object",
          required: ["name", "segmentId", "message"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            segmentId: { type: "string" },
            message: {
              type: "object",
              properties: {
                content: { type: "string" },
                subject: { type: "string" },
                template: {
                  type: "string",
                  enum: ["default", "promotional", "transactional", "reminder"],
                },
              },
            },
            delivery: {
              type: "object",
              properties: {
                channel: { type: "string", enum: ["email", "sms", "both"] },
                scheduledAt: { type: "string", format: "date-time" },
                status: {
                  type: "string",
                  enum: [
                    "draft",
                    "scheduled",
                    "sending",
                    "sent",
                    "failed",
                    "cancelled",
                  ],
                },
              },
            },
            stats: {
              type: "object",
              properties: {
                audienceSize: { type: "number" },
                totalSent: { type: "number" },
                totalFailed: { type: "number" },
                deliveryRate: { type: "number" },
              },
            },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "number" },
          },
        },
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {},
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // paths to files containing OpenAPI definitions
};

module.exports = swaggerJsdoc(options);
