const { Customer, Order } = require("../models");

class CustomerController {
  /**
   * Create a new customer
   */
  async createCustomer(req, res) {
    try {
      const customerData = req.body;

      // Generate customerId if not provided
      if (!customerData.customerId) {
        customerData.customerId = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      }

      // Create customer directly in MongoDB
      const customer = new Customer(customerData);
      await customer.save();

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (error) {
      console.error("Create customer error:", error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          error: "Customer already exists",
          message: "A customer with this ID or email already exists",
        });
      }
      
      res.status(500).json({
        error: "Failed to create customer",
        message: error.message,
      });
    }
  }

  /**
   * Bulk create customers
   */
  async createCustomersBulk(req, res) {
    try {
      const { customers } = req.body;

      if (!Array.isArray(customers) || customers.length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "customers array is required and cannot be empty",
        });
      }

      // Validate batch size
      if (customers.length > 1000) {
        return res.status(400).json({
          error: "Batch too large",
          message: "Maximum 1000 customers per batch",
        });
      }

      // Create customers directly in MongoDB
      const createdCustomers = await Customer.insertMany(customers, { ordered: false });

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdCustomers.length} customers`,
        data: {
          created: createdCustomers.length,
          customers: createdCustomers,
        },
      });
    } catch (error) {
      console.error("Bulk create customers error:", error);
      res.status(500).json({
        error: "Failed to create customers",
        message: error.message,
      });
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await Customer.findOne({ customerId });
      if (!customer) {
        return res.status(404).json({
          error: "Customer not found",
          message: `Customer with ID ${customerId} does not exist`,
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error("Get customer error:", error);
      res.status(500).json({
        error: "Failed to fetch customer",
        message: error.message,
      });
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.customerId;
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const customer = await Customer.findOneAndUpdate(
        { customerId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found",
          message: `Customer with ID ${customerId} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({
        error: "Failed to update customer",
        message: error.message,
      });
    }
  }

  /**
   * Get customers with filtering and pagination
   */
  async getCustomers(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = "createdAt",
        sortOrder = "desc",
        search,
        segments,
        minSpending,
        maxSpending,
        isActive,
      } = req.query;

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { customerId: { $regex: search, $options: "i" } },
        ];
      }

      if (segments) {
        const segmentArray = Array.isArray(segments) ? segments : [segments];
        query.segments = { $in: segmentArray };
      }

      if (minSpending !== undefined || maxSpending !== undefined) {
        query.totalSpending = {};
        if (minSpending !== undefined)
          query.totalSpending.$gte = Number(minSpending);
        if (maxSpending !== undefined)
          query.totalSpending.$lte = Number(maxSpending);
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const [customers, total] = await Promise.all([
        Customer.find(query).sort(sort).skip(skip).limit(Number(limit)).lean(),
        Customer.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({
        error: "Failed to fetch customers",
        message: error.message,
      });
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(req, res) {
    try {
      const analytics = await Customer.aggregate([
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: {
              $sum: { $cond: ["$isActive", 1, 0] },
            },
            totalSpending: { $sum: "$totalSpending" },
            averageSpending: { $avg: "$totalSpending" },
            averageVisits: { $avg: "$totalVisits" },
          },
        },
        {
          $project: {
            _id: 0,
            totalCustomers: 1,
            activeCustomers: 1,
            inactiveCustomers: {
              $subtract: ["$totalCustomers", "$activeCustomers"],
            },
            totalSpending: { $round: ["$totalSpending", 2] },
            averageSpending: { $round: ["$averageSpending", 2] },
            averageVisits: { $round: ["$averageVisits", 2] },
          },
        },
      ]);

      // Get spending distribution
      const spendingDistribution = await Customer.aggregate([
        {
          $bucket: {
            groupBy: "$totalSpending",
            boundaries: [0, 1000, 5000, 10000, 50000, 100000, Infinity],
            default: "Unknown",
            output: {
              count: { $sum: 1 },
              averageSpending: { $avg: "$totalSpending" },
            },
          },
        },
      ]);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRegistrations = await Customer.countDocuments({
        registrationDate: { $gte: thirtyDaysAgo },
      });

      res.json({
        success: true,
        data: {
          summary: analytics[0] || {},
          spendingDistribution,
          recentRegistrations,
        },
      });
    } catch (error) {
      console.error("Get customer analytics error:", error);
      res.status(500).json({
        error: "Failed to fetch customer analytics",
        message: error.message,
      });
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await Customer.findOneAndUpdate(
        { customerId },
        { isActive: false },
        { new: true }
      );

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found",
          message: `Customer with ID ${customerId} does not exist`,
        });
      }

      res.json({
        success: true,
        message: "Customer deactivated successfully",
        data: customer,
      });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({
        error: "Failed to delete customer",
        message: error.message,
      });
    }
  }

  /**
   * Get customer statistics for dashboard
   */
  async getCustomerStats(req, res) {
    try {
      // Get total customers
      const totalCustomers = await Customer.countDocuments({ isActive: true });
      
      // Get new customers this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const newCustomersThisMonth = await Customer.countDocuments({
        isActive: true,
        createdAt: { $gte: startOfMonth }
      });
      
      // Get total revenue
      const revenueStats = await Customer.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalSpending" } } }
      ]);
      
      const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
      
      // Get active customers (visited in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeCustomers = await Customer.countDocuments({
        isActive: true,
        lastVisit: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          totalCustomers,
          newCustomersThisMonth,
          totalRevenue,
          activeCustomers
        },
      });
    } catch (error) {
      console.error("Get customer stats error:", error);
      res.status(500).json({
        error: "Failed to fetch customer statistics",
        message: error.message,
      });
    }
  }
}

module.exports = new CustomerController();
