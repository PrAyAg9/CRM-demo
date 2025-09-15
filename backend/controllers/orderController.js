const { Order, Customer } = require("../models");
const redisService = require("../services/redisService");

class OrderController {
  /**
   * Create a new order
   */
  async createOrder(req, res) {
    try {
      const orderData = req.body;

      // Publish to Redis Stream for async processing
      await redisService.publishOrderEvent("order.create", orderData);

      res.status(202).json({
        success: true,
        message: "Order creation request received and is being processed",
        data: {
          orderId: orderData.orderId,
          customerId: orderData.customerId,
          status: "processing",
        },
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({
        error: "Failed to process order creation request",
        message: error.message,
      });
    }
  }

  /**
   * Bulk create orders
   */
  async createOrdersBulk(req, res) {
    try {
      const { orders } = req.body;

      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "orders array is required and cannot be empty",
        });
      }

      // Validate batch size
      if (orders.length > 500) {
        return res.status(400).json({
          error: "Batch too large",
          message: "Maximum 500 orders per batch",
        });
      }

      // Publish each order to Redis Stream
      for (const order of orders) {
        await redisService.publishOrderEvent("order.bulk_create", order);
      }

      res.status(202).json({
        success: true,
        message: `Bulk order creation request received for ${orders.length} orders`,
        data: {
          batchSize: orders.length,
          status: "processing",
        },
      });
    } catch (error) {
      console.error("Bulk create orders error:", error);
      res.status(500).json({
        error: "Failed to process bulk order creation",
        message: error.message,
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({ orderId }).populate(
        "customerId",
        "name email phone"
      );

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          message: `Order with ID ${orderId} does not exist`,
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({
        error: "Failed to fetch order",
        message: error.message,
      });
    }
  }

  /**
   * Get orders with filtering and pagination
   */
  async getOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = "orderDate",
        sortOrder = "desc",
        customerId,
        status,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        category,
      } = req.query;

      // Build query
      const query = {};

      if (customerId) {
        query.customerId = customerId;
      }

      if (status) {
        query.status = status;
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        query.amount = {};
        if (minAmount !== undefined) query.amount.$gte = Number(minAmount);
        if (maxAmount !== undefined) query.amount.$lte = Number(maxAmount);
      }

      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = new Date(startDate);
        if (endDate) query.orderDate.$lte = new Date(endDate);
      }

      if (category) {
        query["items.category"] = { $regex: category, $options: "i" };
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const [orders, total] = await Promise.all([
        Order.find(query).sort(sort).skip(skip).limit(Number(limit)).lean(),
        Order.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({
        error: "Failed to fetch orders",
        message: error.message,
      });
    }
  }

  /**
   * Get customer's order history
   */
  async getCustomerOrders(req, res) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Check if customer exists
      const customer = await Customer.findOne({ customerId });
      if (!customer) {
        return res.status(404).json({
          error: "Customer not found",
          message: `Customer with ID ${customerId} does not exist`,
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [orders, total] = await Promise.all([
        Order.find({ customerId })
          .sort({ orderDate: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Order.countDocuments({ customerId }),
      ]);

      // Calculate customer order statistics
      const orderStats = await Order.aggregate([
        { $match: { customerId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$amount" },
            averageOrderValue: { $avg: "$amount" },
            lastOrderDate: { $max: "$orderDate" },
          },
        },
      ]);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
          statistics: orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: null,
          },
        },
      });
    } catch (error) {
      console.error("Get customer orders error:", error);
      res.status(500).json({
        error: "Failed to fetch customer orders",
        message: error.message,
      });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;

      const order = await Order.findOneAndUpdate(
        { orderId },
        {
          status,
          ...(notes && { notes }),
          ...(status === "delivered" && { deliveryDate: new Date() }),
        },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
          message: `Order with ID ${orderId} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({
        error: "Failed to update order status",
        message: error.message,
      });
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(req, res) {
    try {
      const { period = "30" } = req.query; // days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(period));

      // Overall statistics
      const [overallStats, recentStats, statusDistribution, categoryStats] =
        await Promise.all([
          Order.aggregate([
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$amount" },
                averageOrderValue: { $avg: "$amount" },
                maxOrderValue: { $max: "$amount" },
                minOrderValue: { $min: "$amount" },
              },
            },
          ]),
          Order.aggregate([
            { $match: { orderDate: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                recentOrders: { $sum: 1 },
                recentRevenue: { $sum: "$amount" },
              },
            },
          ]),
          Order.aggregate([
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalValue: { $sum: "$amount" },
              },
            },
          ]),
          Order.aggregate([
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.category",
                totalQuantity: { $sum: "$items.quantity" },
                totalRevenue: { $sum: "$items.totalPrice" },
                orderCount: { $sum: 1 },
              },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
          ]),
        ]);

      // Daily trend for the period
      const dailyTrend = await Order.aggregate([
        { $match: { orderDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
              day: { $dayOfMonth: "$orderDate" },
            },
            orders: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      res.json({
        success: true,
        data: {
          overall: overallStats[0] || {},
          recent: recentStats[0] || {},
          statusDistribution,
          topCategories: categoryStats,
          dailyTrend: dailyTrend.map((day) => ({
            date: new Date(day._id.year, day._id.month - 1, day._id.day),
            orders: day.orders,
            revenue: day.revenue,
          })),
        },
      });
    } catch (error) {
      console.error("Get order analytics error:", error);
      res.status(500).json({
        error: "Failed to fetch order analytics",
        message: error.message,
      });
    }
  }

  /**
   * Delete order (soft delete - cancel)
   */
  async deleteOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOneAndUpdate(
        { orderId, status: { $nin: ["delivered", "cancelled"] } },
        { status: "cancelled" },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          error: "Order not found or cannot be cancelled",
          message: "Order may not exist or is already delivered/cancelled",
        });
      }

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: order,
      });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({
        error: "Failed to cancel order",
        message: error.message,
      });
    }
  }
}

module.exports = new OrderController();
