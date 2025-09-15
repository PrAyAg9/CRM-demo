const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { faker } = require("@faker-js/faker");
const Customer = require("../src/models/Customer");
const Order = require("../src/models/Order");
const Campaign = require("../src/models/Campaign");
const Segment = require("../src/models/Segment");

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mini-crm"
    );
    console.log("MongoDB connected for demo data generation");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Generate random customers
const generateCustomers = async (count = 100) => {
  console.log(`Generating ${count} customers...`);
  const customers = [];

  for (let i = 0; i < count; i++) {
    const customer = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      location: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      preferences: {
        channel: faker.helpers.arrayElement(["email", "sms", "push"]),
        frequency: faker.helpers.arrayElement(["daily", "weekly", "monthly"]),
        categories: faker.helpers.arrayElements(
          ["electronics", "clothing", "books", "home", "sports"],
          2
        ),
      },
      tags: faker.helpers.arrayElements(
        ["vip", "loyal", "new", "at-risk", "churned"],
        2
      ),
      notes: faker.lorem.sentences(2),
      createdAt: faker.date.between({ from: "2022-01-01", to: new Date() }),
    };

    customers.push(customer);
  }

  const createdCustomers = await Customer.insertMany(customers);
  console.log(`✓ Created ${createdCustomers.length} customers`);
  return createdCustomers;
};

// Generate random orders for customers
const generateOrders = async (customers, ordersPerCustomer = 3) => {
  console.log(`Generating orders for customers...`);
  const orders = [];

  for (const customer of customers) {
    const orderCount = faker.number.int({ min: 0, max: ordersPerCustomer * 2 });

    for (let i = 0; i < orderCount; i++) {
      const orderDate = faker.date.between({
        from: customer.createdAt,
        to: new Date(),
      });

      const items = [];
      const itemCount = faker.number.int({ min: 1, max: 5 });

      for (let j = 0; j < itemCount; j++) {
        items.push({
          productId: faker.string.uuid(),
          name: faker.commerce.productName(),
          price: parseFloat(faker.commerce.price()),
          quantity: faker.number.int({ min: 1, max: 3 }),
          category: faker.helpers.arrayElement([
            "electronics",
            "clothing",
            "books",
            "home",
            "sports",
          ]),
        });
      }

      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = subtotal * 0.08;
      const shipping = subtotal > 50 ? 0 : 9.99;
      const total = subtotal + tax + shipping;

      const order = {
        customerId: customer._id,
        orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
        items,
        subtotal,
        tax,
        shipping,
        total,
        status: faker.helpers.arrayElement([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ]),
        paymentStatus: faker.helpers.arrayElement([
          "pending",
          "paid",
          "failed",
          "refunded",
        ]),
        shippingAddress: customer.location,
        orderDate,
        createdAt: orderDate,
      };

      orders.push(order);
    }
  }

  const createdOrders = await Order.insertMany(orders);
  console.log(`✓ Created ${createdOrders.length} orders`);

  // Update customer order counts and total spent
  console.log("Updating customer metrics...");
  for (const customer of customers) {
    const customerOrders = createdOrders.filter(
      (order) => order.customerId.toString() === customer._id.toString()
    );

    const orderCount = customerOrders.length;
    const totalSpent = customerOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const lastOrderDate =
      customerOrders.length > 0
        ? new Date(
            Math.max(...customerOrders.map((o) => new Date(o.orderDate)))
          )
        : null;

    await Customer.findByIdAndUpdate(customer._id, {
      orderCount,
      totalSpent,
      lastOrderDate,
      averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
    });
  }

  console.log("✓ Updated customer metrics");
  return createdOrders;
};

// Generate sample segments
const generateSegments = async () => {
  console.log("Creating sample segments...");

  const segments = [
    {
      name: "High-Value Customers",
      description: "Customers who have spent more than $500",
      rules: {
        id: "root",
        logic: "AND",
        rules: [
          {
            id: "rule1",
            field: "totalSpent",
            operator: "greater_than",
            value: 500,
            type: "number",
          },
        ],
      },
      source: "manual",
    },
    {
      name: "New Customers",
      description: "Customers who joined in the last 30 days",
      rules: {
        id: "root",
        logic: "AND",
        rules: [
          {
            id: "rule1",
            field: "createdAt",
            operator: "last_n_days",
            value: 30,
            type: "date",
          },
        ],
      },
      source: "manual",
    },
    {
      name: "VIP Customers",
      description: "High-spending customers with many orders",
      rules: {
        id: "root",
        logic: "AND",
        rules: [
          {
            id: "rule1",
            field: "totalSpent",
            operator: "greater_than",
            value: 1000,
            type: "number",
          },
          {
            id: "rule2",
            field: "orderCount",
            operator: "greater_than",
            value: 5,
            type: "number",
          },
        ],
      },
      source: "manual",
    },
    {
      name: "At-Risk Customers",
      description: "Customers who haven't ordered in 60+ days",
      rules: {
        id: "root",
        logic: "AND",
        rules: [
          {
            id: "rule1",
            field: "lastOrderDate",
            operator: "before",
            value: new Date(
              Date.now() - 60 * 24 * 60 * 60 * 1000
            ).toISOString(),
            type: "date",
          },
          {
            id: "rule2",
            field: "orderCount",
            operator: "greater_than",
            value: 0,
            type: "number",
          },
        ],
      },
      source: "ai_generated",
    },
  ];

  const createdSegments = await Segment.insertMany(segments);
  console.log(`✓ Created ${createdSegments.length} segments`);
  return createdSegments;
};

// Generate sample campaigns
const generateCampaigns = async (segments) => {
  console.log("Creating sample campaigns...");

  const campaigns = [
    {
      name: "Welcome Email Series",
      type: "email",
      subject: "Welcome to Our Store!",
      content: `Hi {{firstName}},

Welcome to our amazing store! We're thrilled to have you as part of our community.

As a new member, you'll receive:
• Exclusive discounts and early access to sales
• Personalized product recommendations
• Expert tips and advice

Start shopping: {{shop_url}}

Best regards,
The Team`,
      audienceType: "segment",
      segmentId: segments.find((s) => s.name === "New Customers")?._id,
      schedulingType: "immediate",
      status: "sent",
      metrics: {
        sent: 45,
        delivered: 43,
        opened: 28,
        clicked: 12,
        bounced: 2,
        unsubscribed: 1,
      },
      createdAt: faker.date.recent({ days: 30 }),
    },
    {
      name: "VIP Exclusive Sale",
      type: "email",
      subject: "🌟 VIP ONLY: 30% Off Everything!",
      content: `Dear {{firstName}},

As one of our most valued customers, you get exclusive early access to our biggest sale of the year!

Use code: VIP30 for 30% off everything
Valid until: {{expiry_date}}

Shop now: {{shop_url}}

Thank you for your loyalty!`,
      audienceType: "segment",
      segmentId: segments.find((s) => s.name === "VIP Customers")?._id,
      schedulingType: "scheduled",
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "scheduled",
      createdAt: faker.date.recent({ days: 5 }),
    },
    {
      name: "Win-Back Campaign",
      type: "email",
      subject: "We miss you! Come back for 20% off",
      content: `Hi {{firstName}},

We haven't seen you in a while and we miss you!

As a valued customer, we'd like to offer you 20% off your next purchase.

Use code: COMEBACK20

Shop now: {{shop_url}}

This offer expires in 7 days, so don't wait!`,
      audienceType: "segment",
      segmentId: segments.find((s) => s.name === "At-Risk Customers")?._id,
      schedulingType: "immediate",
      status: "draft",
      createdAt: faker.date.recent({ days: 2 }),
    },
    {
      name: "Flash Sale SMS",
      type: "sms",
      content:
        "⚡ FLASH SALE: 30% off everything! Limited time only. Use code FLASH30. Shop now: {{shop_url}}",
      audienceType: "all",
      schedulingType: "immediate",
      status: "sent",
      metrics: {
        sent: 156,
        delivered: 152,
        clicked: 23,
        bounced: 4,
      },
      createdAt: faker.date.recent({ days: 10 }),
    },
  ];

  const createdCampaigns = await Campaign.insertMany(campaigns);
  console.log(`✓ Created ${createdCampaigns.length} campaigns`);
  return createdCampaigns;
};

// Main function to generate all demo data
const generateDemoData = async () => {
  try {
    console.log("🚀 Starting demo data generation...\n");

    await connectDB();

    // Clear existing data
    console.log("Clearing existing data...");
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await Segment.deleteMany({});
    console.log("✓ Cleared existing data\n");

    // Generate data
    const customers = await generateCustomers(100);
    await generateOrders(customers, 3);
    const segments = await generateSegments();
    await generateCampaigns(segments);

    console.log("\n🎉 Demo data generation completed successfully!");
    console.log("Summary:");
    console.log(`- ${customers.length} customers created`);
    console.log(`- Orders generated for all customers`);
    console.log(`- ${segments.length} segments created`);
    console.log(`- 4 sample campaigns created`);

    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  } catch (error) {
    console.error("Error generating demo data:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  generateDemoData();
}

module.exports = {
  generateDemoData,
  generateCustomers,
  generateOrders,
  generateSegments,
  generateCampaigns,
};
