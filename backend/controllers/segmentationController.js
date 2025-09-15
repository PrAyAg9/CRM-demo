const { Segment, Customer } = require("../models");
const redisService = require("../services/redisService");

class SegmentationController {
  /**
   * Create a new segment
   */
  async createSegment(req, res) {
    try {
      const segmentData = {
        ...req.body,
        createdBy: req.user._id,
      };

      const segment = new Segment(segmentData);

      // Calculate initial audience size
      const audienceSize = await this.calculateAudienceSize(segment);
      segment.audienceSize = audienceSize;
      segment.lastCalculated = new Date();

      await segment.save();

      res.status(201).json({
        success: true,
        message: "Segment created successfully",
        data: segment,
      });
    } catch (error) {
      console.error("Create segment error:", error);
      res.status(500).json({
        error: "Failed to create segment",
        message: error.message,
      });
    }
  }

  /**
   * Get all segments for the user
   */
  async getSegments(req, res) {
    try {
      const { page = 1, limit = 20, search, isActive, tags } = req.query;

      // Build query
      const query = { createdBy: req.user._id };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagArray };
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Execute query
      const [segments, total] = await Promise.all([
        Segment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Segment.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          segments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Get segments error:", error);
      res.status(500).json({
        error: "Failed to fetch segments",
        message: error.message,
      });
    }
  }

  /**
   * Get segment by ID
   */
  async getSegment(req, res) {
    try {
      const { segmentId } = req.params;

      const segment = await Segment.findOne({
        _id: segmentId,
        createdBy: req.user._id,
      });

      if (!segment) {
        return res.status(404).json({
          error: "Segment not found",
          message: "Segment does not exist or you do not have access to it",
        });
      }

      res.json({
        success: true,
        data: segment,
      });
    } catch (error) {
      console.error("Get segment error:", error);
      res.status(500).json({
        error: "Failed to fetch segment",
        message: error.message,
      });
    }
  }

  /**
   * Update segment
   */
  async updateSegment(req, res) {
    try {
      const { segmentId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.createdBy;
      delete updateData._id;

      const segment = await Segment.findOneAndUpdate(
        { _id: segmentId, createdBy: req.user._id },
        updateData,
        { new: true, runValidators: true }
      );

      if (!segment) {
        return res.status(404).json({
          error: "Segment not found",
          message: "Segment does not exist or you do not have access to it",
        });
      }

      // Recalculate audience size if rules changed
      if (updateData.ruleGroups) {
        const audienceSize = await this.calculateAudienceSize(segment);
        segment.audienceSize = audienceSize;
        segment.lastCalculated = new Date();
        await segment.save();
      }

      res.json({
        success: true,
        message: "Segment updated successfully",
        data: segment,
      });
    } catch (error) {
      console.error("Update segment error:", error);
      res.status(500).json({
        error: "Failed to update segment",
        message: error.message,
      });
    }
  }

  /**
   * Delete segment
   */
  async deleteSegment(req, res) {
    try {
      const { segmentId } = req.params;

      const segment = await Segment.findOneAndUpdate(
        { _id: segmentId, createdBy: req.user._id },
        { isActive: false },
        { new: true }
      );

      if (!segment) {
        return res.status(404).json({
          error: "Segment not found",
          message: "Segment does not exist or you do not have access to it",
        });
      }

      res.json({
        success: true,
        message: "Segment deleted successfully",
        data: segment,
      });
    } catch (error) {
      console.error("Delete segment error:", error);
      res.status(500).json({
        error: "Failed to delete segment",
        message: error.message,
      });
    }
  }

  /**
   * Preview audience size for given rules
   */
  async previewAudience(req, res) {
    try {
      const { ruleGroups } = req.body;

      if (!ruleGroups || !Array.isArray(ruleGroups)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "ruleGroups array is required",
        });
      }

      // Create temporary segment for calculation
      const tempSegment = new Segment({
        name: "temp",
        ruleGroups,
        createdBy: req.user._id,
      });

      const audienceSize = await this.calculateAudienceSize(tempSegment);

      // Get sample customers (first 10)
      const pipeline = tempSegment.buildAggregationPipeline();
      pipeline.push({ $limit: 10 });
      pipeline.push({
        $project: {
          customerId: 1,
          name: 1,
          email: 1,
          totalSpending: 1,
          totalVisits: 1,
          lastVisit: 1,
        },
      });

      const sampleCustomers = await Customer.aggregate(pipeline);

      res.json({
        success: true,
        data: {
          audienceSize,
          sampleCustomers,
          previewedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Preview audience error:", error);
      res.status(500).json({
        error: "Failed to preview audience",
        message: error.message,
      });
    }
  }

  /**
   * Get customers in a segment
   */
  async getSegmentCustomers(req, res) {
    try {
      const { segmentId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const segment = await Segment.findOne({
        _id: segmentId,
        createdBy: req.user._id,
      });

      if (!segment) {
        return res.status(404).json({
          error: "Segment not found",
          message: "Segment does not exist or you do not have access to it",
        });
      }

      // Build aggregation pipeline
      const pipeline = segment.buildAggregationPipeline();

      // Add pagination
      const skip = (Number(page) - 1) * Number(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: Number(limit) });

      // Project required fields
      pipeline.push({
        $project: {
          customerId: 1,
          name: 1,
          email: 1,
          phone: 1,
          totalSpending: 1,
          totalVisits: 1,
          lastVisit: 1,
          registrationDate: 1,
          preferences: 1,
        },
      });

      const customers = await Customer.aggregate(pipeline);

      // Get total count
      const countPipeline = segment.buildAggregationPipeline();
      countPipeline.push({ $count: "total" });
      const countResult = await Customer.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

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
      console.error("Get segment customers error:", error);
      res.status(500).json({
        error: "Failed to fetch segment customers",
        message: error.message,
      });
    }
  }

  /**
   * Get available field options for rule building
   */
  async getFieldOptions(req, res) {
    try {
      const fieldOptions = {
        fields: [
          {
            name: "totalSpending",
            label: "Total Spending",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "totalVisits",
            label: "Total Visits",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "daysSinceLastVisit",
            label: "Days Since Last Visit",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "registrationDaysAgo",
            label: "Days Since Registration",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "orderCount",
            label: "Number of Orders",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "averageOrderValue",
            label: "Average Order Value",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "lastOrderDaysAgo",
            label: "Days Since Last Order",
            type: "number",
            operators: [">", "<", ">=", "<=", "=", "!="],
          },
          {
            name: "preferredCategory",
            label: "Preferred Category",
            type: "string",
            operators: ["contains", "not_contains", "=", "!="],
          },
          {
            name: "churnRisk",
            label: "Churn Risk",
            type: "string",
            operators: ["=", "!="],
            options: ["low", "medium", "high"],
          },
        ],
        operators: [
          { value: ">", label: "Greater than" },
          { value: "<", label: "Less than" },
          { value: ">=", label: "Greater than or equal" },
          { value: "<=", label: "Less than or equal" },
          { value: "=", label: "Equal to" },
          { value: "!=", label: "Not equal to" },
          { value: "contains", label: "Contains" },
          { value: "not_contains", label: "Does not contain" },
          { value: "in", label: "In list" },
          { value: "not_in", label: "Not in list" },
        ],
      };

      res.json({
        success: true,
        data: fieldOptions,
      });
    } catch (error) {
      console.error("Get field options error:", error);
      res.status(500).json({
        error: "Failed to fetch field options",
        message: error.message,
      });
    }
  }

  /**
   * Calculate audience size for a segment
   */
  async calculateAudienceSize(segment) {
    try {
      const pipeline = segment.buildAggregationPipeline();
      pipeline.push({ $count: "total" });

      const result = await Customer.aggregate(pipeline);
      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error("Calculate audience size error:", error);
      return 0;
    }
  }

  /**
   * Recalculate audience sizes for all segments (background job)
   */
  async recalculateAllSegments(req, res) {
    try {
      const segments = await Segment.find({ isActive: true });
      let updatedCount = 0;

      for (const segment of segments) {
        try {
          const audienceSize = await this.calculateAudienceSize(segment);
          await Segment.findByIdAndUpdate(segment._id, {
            audienceSize,
            lastCalculated: new Date(),
          });
          updatedCount++;
        } catch (error) {
          console.error(`Error updating segment ${segment._id}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Recalculated ${updatedCount} segments`,
        data: {
          totalSegments: segments.length,
          updatedSegments: updatedCount,
        },
      });
    } catch (error) {
      console.error("Recalculate segments error:", error);
      res.status(500).json({
        error: "Failed to recalculate segments",
        message: error.message,
      });
    }
  }
}

module.exports = new SegmentationController();
