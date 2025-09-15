const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
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
    segmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Segment",
      required: true,
    },
    message: {
      content: {
        type: String,
        required: true,
      },
      subject: {
        type: String,
      },
      template: {
        type: String,
        enum: ["default", "promotional", "transactional", "reminder"],
        default: "default",
      },
      // AI-generated message variants
      variants: [
        {
          content: String,
          tone: String,
          generatedBy: String,
        },
      ],
    },
    delivery: {
      channel: {
        type: String,
        enum: ["email", "sms", "both"],
        default: "email",
      },
      scheduledAt: {
        type: Date,
      },
      deliveredAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["draft", "scheduled", "sending", "sent", "failed", "cancelled"],
        default: "draft",
      },
    },
    stats: {
      audienceSize: {
        type: Number,
        default: 0,
      },
      totalSent: {
        type: Number,
        default: 0,
      },
      totalFailed: {
        type: Number,
        default: 0,
      },
      deliveryRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
      },
    },
    settings: {
      priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal",
      },
      retryOnFailure: {
        type: Boolean,
        default: true,
      },
      maxRetries: {
        type: Number,
        default: 3,
      },
    },
    // AI-generated insights
    aiInsights: {
      performancePrediction: Number,
      recommendedTiming: String,
      targetAudienceInsights: String,
      messageOptimization: String,
      generatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ segmentId: 1 });
campaignSchema.index({ "delivery.status": 1 });
campaignSchema.index({ "delivery.scheduledAt": 1 });
campaignSchema.index({ createdAt: -1 });

// Virtual for delivery success rate
campaignSchema.virtual("successRate").get(function () {
  if (this.stats.totalSent === 0) return 0;
  return (
    ((this.stats.totalSent - this.stats.totalFailed) / this.stats.totalSent) *
    100
  );
});

// Method to update delivery stats
campaignSchema.methods.updateStats = function (sentCount, failedCount) {
  this.stats.totalSent += sentCount;
  this.stats.totalFailed += failedCount;
  this.stats.deliveryRate = this.successRate;
  this.stats.lastUpdated = new Date();
  return this.save();
};

// Method to check if campaign can be sent
campaignSchema.methods.canBeSent = function () {
  return ["draft", "scheduled"].includes(this.delivery.status);
};

// Static method to get campaigns by status
campaignSchema.statics.findByStatus = function (status) {
  return this.find({ "delivery.status": status });
};

// Static method to get recent campaigns
campaignSchema.statics.findRecent = function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    createdAt: { $gte: startDate },
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Campaign", campaignSchema);
