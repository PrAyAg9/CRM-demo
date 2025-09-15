// MongoDB initialization script
// This script creates the initial database structure and users

// Switch to the mini_crm database
db = db.getSiblingDB("mini_crm");

// Create application user
db.createUser({
  user: "crm_user",
  pwd: "crm_password_123",
  roles: [
    {
      role: "readWrite",
      db: "mini_crm",
    },
  ],
});

// Create collections with validation schemas
db.createCollection("customers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["firstName", "lastName", "email"],
      properties: {
        firstName: {
          bsonType: "string",
          description: "First name is required and must be a string",
        },
        lastName: {
          bsonType: "string",
          description: "Last name is required and must be a string",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email is required and must be a valid email address",
        },
        phone: {
          bsonType: "string",
          description: "Phone number must be a string",
        },
        totalSpent: {
          bsonType: "number",
          minimum: 0,
          description: "Total spent must be a non-negative number",
        },
        orderCount: {
          bsonType: "int",
          minimum: 0,
          description: "Order count must be a non-negative integer",
        },
      },
    },
  },
});

db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["customerId", "amount", "status"],
      properties: {
        customerId: {
          bsonType: "objectId",
          description: "Customer ID is required and must be an ObjectId",
        },
        amount: {
          bsonType: "number",
          minimum: 0,
          description: "Amount is required and must be a non-negative number",
        },
        status: {
          bsonType: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          description: "Status must be one of the predefined values",
        },
      },
    },
  },
});

db.createCollection("campaigns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "type", "status"],
      properties: {
        name: {
          bsonType: "string",
          description: "Campaign name is required and must be a string",
        },
        type: {
          bsonType: "string",
          enum: ["email", "sms", "push"],
          description: "Campaign type must be email, sms, or push",
        },
        status: {
          bsonType: "string",
          enum: ["draft", "scheduled", "sending", "sent", "paused", "failed"],
          description: "Status must be one of the predefined values",
        },
      },
    },
  },
});

db.createCollection("segments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "rules"],
      properties: {
        name: {
          bsonType: "string",
          description: "Segment name is required and must be a string",
        },
        rules: {
          bsonType: "object",
          description: "Segment rules are required and must be an object",
        },
      },
    },
  },
});

// Create indexes for better performance
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ firstName: 1, lastName: 1 });
db.customers.createIndex({ totalSpent: -1 });
db.customers.createIndex({ orderCount: -1 });
db.customers.createIndex({ lastOrderDate: -1 });
db.customers.createIndex({ createdAt: -1 });

db.orders.createIndex({ customerId: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ amount: -1 });

db.campaigns.createIndex({ status: 1 });
db.campaigns.createIndex({ type: 1 });
db.campaigns.createIndex({ createdAt: -1 });
db.campaigns.createIndex({ scheduledAt: 1 });

db.segments.createIndex({ name: 1 }, { unique: true });
db.segments.createIndex({ createdAt: -1 });

// Insert sample admin user (in production, this should be done securely)
db.users.insertOne({
  email: "admin@mini-crm.com",
  name: "System Administrator",
  role: "admin",
  createdAt: new Date(),
  lastLogin: null,
  isActive: true,
});

print("MongoDB initialization completed successfully");
print("Database: mini_crm");
print("Collections created: customers, orders, campaigns, segments, users");
print("Indexes created for optimal performance");
print("Application user created: crm_user");
