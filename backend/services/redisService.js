const redis = require("redis");
const { Customer, Order } = require("../models");

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.streams = {
      customers: "customer-events",
      orders: "order-events",
      campaigns: "campaign-events",
    };
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });

      this.client.on("error", (err) => {
        console.error("Redis client error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis client connected");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis client ready");
        this.startConsumers();
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error("Redis connection error:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Publish customer event to Redis Stream
   */
  async publishCustomerEvent(eventType, data) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      const streamKey = this.streams.customers;
      const event = {
        eventType,
        data: JSON.stringify(data),
        timestamp: Date.now().toString(),
        id: `${eventType}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      await this.client.xAdd(streamKey, "*", event);
      console.log(`Published customer event: ${eventType}`);
    } catch (error) {
      console.error("Error publishing customer event:", error);
      throw error;
    }
  }

  /**
   * Publish order event to Redis Stream
   */
  async publishOrderEvent(eventType, data) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      const streamKey = this.streams.orders;
      const event = {
        eventType,
        data: JSON.stringify(data),
        timestamp: Date.now().toString(),
        id: `${eventType}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      await this.client.xAdd(streamKey, "*", event);
      console.log(`Published order event: ${eventType}`);
    } catch (error) {
      console.error("Error publishing order event:", error);
      throw error;
    }
  }

  /**
   * Publish campaign event to Redis Stream
   */
  async publishCampaignEvent(eventType, data) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      const streamKey = this.streams.campaigns;
      const event = {
        eventType,
        data: JSON.stringify(data),
        timestamp: Date.now().toString(),
        id: `${eventType}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      await this.client.xAdd(streamKey, "*", event);
      console.log(`Published campaign event: ${eventType}`);
    } catch (error) {
      console.error("Error publishing campaign event:", error);
      throw error;
    }
  }

  /**
   * Start consumers for processing events
   */
  async startConsumers() {
    console.log("Starting Redis Stream consumers...");

    // Start customer event consumer
    this.consumeCustomerEvents();

    // Start order event consumer
    this.consumeOrderEvents();

    // Start campaign event consumer
    this.consumeCampaignEvents();
  }

  /**
   * Consumer for customer events
   */
  async consumeCustomerEvents() {
    const consumerGroup = "customer-processors";
    const consumerName = `customer-consumer-${process.pid}`;
    const streamKey = this.streams.customers;

    try {
      // Create consumer group if it doesn't exist
      try {
        await this.client.xGroupCreate(streamKey, consumerGroup, "0", {
          MKSTREAM: true,
        });
      } catch (error) {
        // Group already exists
        if (!error.message.includes("BUSYGROUP")) {
          throw error;
        }
      }

      // Process events continuously
      while (this.isConnected) {
        try {
          const messages = await this.client.xReadGroup(
            consumerGroup,
            consumerName,
            [{ key: streamKey, id: ">" }],
            { COUNT: 10, BLOCK: 1000 }
          );

          for (const stream of messages || []) {
            for (const message of stream.messages) {
              await this.processCustomerEvent(message);
              // Acknowledge message
              await this.client.xAck(streamKey, consumerGroup, message.id);
            }
          }
        } catch (error) {
          console.error("Error consuming customer events:", error);
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s before retry
        }
      }
    } catch (error) {
      console.error("Error setting up customer consumer:", error);
    }
  }

  /**
   * Consumer for order events
   */
  async consumeOrderEvents() {
    const consumerGroup = "order-processors";
    const consumerName = `order-consumer-${process.pid}`;
    const streamKey = this.streams.orders;

    try {
      // Create consumer group if it doesn't exist
      try {
        await this.client.xGroupCreate(streamKey, consumerGroup, "0", {
          MKSTREAM: true,
        });
      } catch (error) {
        if (!error.message.includes("BUSYGROUP")) {
          throw error;
        }
      }

      // Process events continuously
      while (this.isConnected) {
        try {
          const messages = await this.client.xReadGroup(
            consumerGroup,
            consumerName,
            [{ key: streamKey, id: ">" }],
            { COUNT: 10, BLOCK: 1000 }
          );

          for (const stream of messages || []) {
            for (const message of stream.messages) {
              await this.processOrderEvent(message);
              await this.client.xAck(streamKey, consumerGroup, message.id);
            }
          }
        } catch (error) {
          console.error("Error consuming order events:", error);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.error("Error setting up order consumer:", error);
    }
  }

  /**
   * Consumer for campaign events
   */
  async consumeCampaignEvents() {
    const consumerGroup = "campaign-processors";
    const consumerName = `campaign-consumer-${process.pid}`;
    const streamKey = this.streams.campaigns;

    try {
      try {
        await this.client.xGroupCreate(streamKey, consumerGroup, "0", {
          MKSTREAM: true,
        });
      } catch (error) {
        if (!error.message.includes("BUSYGROUP")) {
          throw error;
        }
      }

      while (this.isConnected) {
        try {
          const messages = await this.client.xReadGroup(
            consumerGroup,
            consumerName,
            [{ key: streamKey, id: ">" }],
            { COUNT: 5, BLOCK: 1000 }
          );

          for (const stream of messages || []) {
            for (const message of stream.messages) {
              await this.processCampaignEvent(message);
              await this.client.xAck(streamKey, consumerGroup, message.id);
            }
          }
        } catch (error) {
          console.error("Error consuming campaign events:", error);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.error("Error setting up campaign consumer:", error);
    }
  }

  /**
   * Process customer event
   */
  async processCustomerEvent(message) {
    try {
      const { eventType, data } = message.message;
      const customerData = JSON.parse(data);

      console.log(
        `Processing customer event: ${eventType}`,
        customerData.customerId
      );

      switch (eventType) {
        case "customer.create":
        case "customer.bulk_create":
          await this.createCustomer(customerData);
          break;
        case "customer.update":
          await this.updateCustomer(customerData);
          break;
        default:
          console.warn(`Unknown customer event type: ${eventType}`);
      }
    } catch (error) {
      console.error("Error processing customer event:", error);
    }
  }

  /**
   * Process order event
   */
  async processOrderEvent(message) {
    try {
      const { eventType, data } = message.message;
      const orderData = JSON.parse(data);

      console.log(`Processing order event: ${eventType}`, orderData.orderId);

      switch (eventType) {
        case "order.create":
        case "order.bulk_create":
          await this.createOrder(orderData);
          break;
        case "order.update":
          await this.updateOrder(orderData);
          break;
        default:
          console.warn(`Unknown order event type: ${eventType}`);
      }
    } catch (error) {
      console.error("Error processing order event:", error);
    }
  }

  /**
   * Process campaign event
   */
  async processCampaignEvent(message) {
    try {
      const { eventType, data } = message.message;
      const campaignData = JSON.parse(data);

      console.log(
        `Processing campaign event: ${eventType}`,
        campaignData.campaignId
      );

      switch (eventType) {
        case "campaign.send":
          // This will be implemented in the campaign service
          break;
        case "campaign.delivery_receipt":
          // Handle delivery receipts
          break;
        default:
          console.warn(`Unknown campaign event type: ${eventType}`);
      }
    } catch (error) {
      console.error("Error processing campaign event:", error);
    }
  }

  /**
   * Create customer in database
   */
  async createCustomer(customerData) {
    try {
      // Check if customer already exists
      const existingCustomer = await Customer.findOne({
        customerId: customerData.customerId,
      });

      if (existingCustomer) {
        console.log(
          `Customer ${customerData.customerId} already exists, skipping creation`
        );
        return existingCustomer;
      }

      const customer = new Customer(customerData);
      await customer.save();
      console.log(`Customer ${customerData.customerId} created successfully`);
      return customer;
    } catch (error) {
      console.error(
        `Error creating customer ${customerData.customerId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update customer in database
   */
  async updateCustomer(customerData) {
    try {
      const customer = await Customer.findOneAndUpdate(
        { customerId: customerData.customerId },
        customerData,
        { new: true, upsert: true, runValidators: true }
      );
      console.log(`Customer ${customerData.customerId} updated successfully`);
      return customer;
    } catch (error) {
      console.error(
        `Error updating customer ${customerData.customerId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create order in database and update customer stats
   */
  async createOrder(orderData) {
    try {
      // Check if order already exists
      const existingOrder = await Order.findOne({
        orderId: orderData.orderId,
      });

      if (existingOrder) {
        console.log(
          `Order ${orderData.orderId} already exists, skipping creation`
        );
        return existingOrder;
      }

      const order = new Order(orderData);
      await order.save();

      // Update customer statistics
      await this.updateCustomerStats(orderData.customerId);

      console.log(`Order ${orderData.orderId} created successfully`);
      return order;
    } catch (error) {
      console.error(`Error creating order ${orderData.orderId}:`, error);
      throw error;
    }
  }

  /**
   * Update order in database
   */
  async updateOrder(orderData) {
    try {
      const order = await Order.findOneAndUpdate(
        { orderId: orderData.orderId },
        orderData,
        { new: true, runValidators: true }
      );

      if (order) {
        // Update customer statistics
        await this.updateCustomerStats(order.customerId);
        console.log(`Order ${orderData.orderId} updated successfully`);
      }

      return order;
    } catch (error) {
      console.error(`Error updating order ${orderData.orderId}:`, error);
      throw error;
    }
  }

  /**
   * Update customer statistics based on orders
   */
  async updateCustomerStats(customerId) {
    try {
      const orderStats = await Order.aggregate([
        { $match: { customerId, status: { $nin: ["cancelled", "refunded"] } } },
        {
          $group: {
            _id: null,
            totalSpending: { $sum: "$amount" },
            orderCount: { $sum: 1 },
            lastOrderDate: { $max: "$orderDate" },
          },
        },
      ]);

      if (orderStats.length > 0) {
        const stats = orderStats[0];
        await Customer.findOneAndUpdate(
          { customerId },
          {
            totalSpending: stats.totalSpending,
            totalVisits: stats.orderCount,
            lastVisit: stats.lastOrderDate,
          }
        );
        console.log(`Updated stats for customer ${customerId}`);
      }
    } catch (error) {
      console.error(`Error updating customer stats for ${customerId}:`, error);
    }
  }

  /**
   * Get stream info
   */
  async getStreamInfo(streamName) {
    if (!this.isConnected) {
      throw new Error("Redis client not connected");
    }

    try {
      const info = await this.client.xInfoStream(this.streams[streamName]);
      return info;
    } catch (error) {
      console.error(`Error getting stream info for ${streamName}:`, error);
      throw error;
    }
  }

  /**
   * Cache data with TTL
   */
  async setCache(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  }

  /**
   * Get cached data
   */
  async getCache(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Error getting cache:", error);
      return null;
    }
  }

  /**
   * Delete cached data
   */
  async deleteCache(key) {
    if (!this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error("Error deleting cache:", error);
    }
  }
}

module.exports = new RedisService();
