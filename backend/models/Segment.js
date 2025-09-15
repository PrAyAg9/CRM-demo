const mongoose = require("mongoose");

// Schema for individual rules in a segment
const ruleSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
    enum: [
      "totalSpending",
      "totalVisits",
      "daysSinceLastVisit",
      "registrationDaysAgo",
      "orderCount",
      "averageOrderValue",
      "lastOrderDaysAgo",
      "preferredCategory",
      "churnRisk",
    ],
  },
  operator: {
    type: String,
    required: true,
    enum: [
      ">",
      "<",
      ">=",
      "<=",
      "=",
      "!=",
      "contains",
      "not_contains",
      "in",
      "not_in",
    ],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  dataType: {
    type: String,
    enum: ["number", "string", "date", "array"],
    required: true,
  },
});

// Schema for rule groups with AND/OR logic
const ruleGroupSchema = new mongoose.Schema({
  logic: {
    type: String,
    enum: ["AND", "OR"],
    default: "AND",
  },
  rules: [ruleSchema],
  groups: [this], // Recursive for nested groups
});

const segmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ruleGroups: [ruleGroupSchema],
    // Natural language query that was converted to rules
    naturalLanguageQuery: {
      type: String,
    },
    // Cached audience size for performance
    audienceSize: {
      type: Number,
      default: 0,
    },
    lastCalculated: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // AI-generated insights about this segment
    aiInsights: {
      estimatedReach: Number,
      recommendedCampaignType: String,
      bestDeliveryTime: String,
      predictedEngagement: Number,
      generatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
segmentSchema.index({ name: 1 });
segmentSchema.index({ createdBy: 1 });
segmentSchema.index({ isActive: 1 });
segmentSchema.index({ tags: 1 });

// Method to build MongoDB aggregation pipeline from rules
segmentSchema.methods.buildAggregationPipeline = function () {
  const pipeline = [];

  // Lookup orders for each customer
  pipeline.push({
    $lookup: {
      from: "orders",
      localField: "customerId",
      foreignField: "customerId",
      as: "orders",
    },
  });

  // Add computed fields
  pipeline.push({
    $addFields: {
      orderCount: { $size: "$orders" },
      averageOrderValue: {
        $cond: {
          if: { $gt: [{ $size: "$orders" }, 0] },
          then: { $avg: "$orders.amount" },
          else: 0,
        },
      },
      lastOrderDate: { $max: "$orders.orderDate" },
      daysSinceLastVisit: {
        $cond: {
          if: "$lastVisit",
          then: {
            $divide: [
              { $subtract: [new Date(), "$lastVisit"] },
              1000 * 60 * 60 * 24,
            ],
          },
          else: null,
        },
      },
      registrationDaysAgo: {
        $divide: [
          { $subtract: [new Date(), "$registrationDate"] },
          1000 * 60 * 60 * 24,
        ],
      },
      lastOrderDaysAgo: {
        $cond: {
          if: "$lastOrderDate",
          then: {
            $divide: [
              { $subtract: [new Date(), "$lastOrderDate"] },
              1000 * 60 * 60 * 24,
            ],
          },
          else: null,
        },
      },
    },
  });

  // Build match conditions from rule groups
  const matchConditions = this.buildMatchConditions(this.ruleGroups);
  if (Object.keys(matchConditions).length > 0) {
    pipeline.push({ $match: matchConditions });
  }

  return pipeline;
};

// Helper method to build match conditions recursively
segmentSchema.methods.buildMatchConditions = function (ruleGroups) {
  if (!ruleGroups || ruleGroups.length === 0) return {};

  const conditions = ruleGroups.map((group) => {
    const groupConditions = [];

    // Process rules in this group
    if (group.rules && group.rules.length > 0) {
      group.rules.forEach((rule) => {
        const condition = this.buildRuleCondition(rule);
        if (condition) {
          groupConditions.push(condition);
        }
      });
    }

    // Process nested groups
    if (group.groups && group.groups.length > 0) {
      const nestedConditions = this.buildMatchConditions(group.groups);
      if (Object.keys(nestedConditions).length > 0) {
        groupConditions.push(nestedConditions);
      }
    }

    // Combine conditions based on group logic
    if (groupConditions.length === 0) return {};
    if (groupConditions.length === 1) return groupConditions[0];

    return group.logic === "OR"
      ? { $or: groupConditions }
      : { $and: groupConditions };
  });

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];

  // Multiple groups are combined with AND by default
  return { $and: conditions };
};

// Helper method to build individual rule condition
segmentSchema.methods.buildRuleCondition = function (rule) {
  const { field, operator, value, dataType } = rule;

  const operatorMap = {
    ">": "$gt",
    "<": "$lt",
    ">=": "$gte",
    "<=": "$lte",
    "=": "$eq",
    "!=": "$ne",
    contains: "$regex",
    not_contains: "$not",
    in: "$in",
    not_in: "$nin",
  };

  const mongoOperator = operatorMap[operator];
  if (!mongoOperator) return null;

  let condition = {};

  switch (operator) {
    case "contains":
      condition[field] = { $regex: value, $options: "i" };
      break;
    case "not_contains":
      condition[field] = { $not: { $regex: value, $options: "i" } };
      break;
    default:
      condition[field] = { [mongoOperator]: value };
  }

  return condition;
};

module.exports = mongoose.model("Segment", segmentSchema);
