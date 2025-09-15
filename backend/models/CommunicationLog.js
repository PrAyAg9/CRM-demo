const mongoose = require("mongoose");

const communicationLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    customerId: {
      type: String,
      required: true,
      ref: "Customer",
    },
    message: {
      content: {
        type: String,
        required: true,
      },
      subject: String,
      personalizedContent: String, // AI-personalized version
    },
    delivery: {
      channel: {
        type: String,
        enum: ["email", "sms"],
        required: true,
      },
      recipient: {
        type: String,
        required: true, // email or phone number
      },
      vendorMessageId: {
        type: String, // ID from vendor API
      },
      attemptedAt: {
        type: Date,
        default: Date.now,
      },
      deliveredAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed", "bounced"],
        default: "pending",
      },
      statusCode: {
        type: String,
      },
      errorMessage: {
        type: String,
      },
      retryCount: {
        type: Number,
        default: 0,
      },
    },
    engagement: {
      opened: {
        type: Boolean,
        default: false,
      },
      openedAt: {
        type: Date,
      },
      clicked: {
        type: Boolean,
        default: false,
      },
      clickedAt: {
        type: Date,
      },
      unsubscribed: {
        type: Boolean,
        default: false,
      },
      unsubscribedAt: {
        type: Date,
      },
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      deviceType: String,
      location: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
communicationLogSchema.index({ campaignId: 1 });
communicationLogSchema.index({ customerId: 1 });
communicationLogSchema.index({ "delivery.status": 1 });
communicationLogSchema.index({ "delivery.attemptedAt": -1 });
communicationLogSchema.index({ "delivery.deliveredAt": -1 });
communicationLogSchema.index({ "delivery.vendorMessageId": 1 });

// Compound indexes
communicationLogSchema.index({ campaignId: 1, "delivery.status": 1 });
communicationLogSchema.index({ customerId: 1, "delivery.attemptedAt": -1 });

// Method to mark as delivered
communicationLogSchema.methods.markAsDelivered = function (vendorMessageId) {
  this.delivery.status = "delivered";
  this.delivery.deliveredAt = new Date();
  if (vendorMessageId) {
    this.delivery.vendorMessageId = vendorMessageId;
  }
  return this.save();
};

// Method to mark as failed
communicationLogSchema.methods.markAsFailed = function (
  errorMessage,
  statusCode
) {
  this.delivery.status = "failed";
  this.delivery.errorMessage = errorMessage;
  this.delivery.statusCode = statusCode;
  return this.save();
};

// Method to increment retry count
communicationLogSchema.methods.incrementRetry = function () {
  this.delivery.retryCount += 1;
  this.delivery.attemptedAt = new Date();
  return this.save();
};

// Static method to get delivery statistics for a campaign
communicationLogSchema.statics.getCampaignStats = function (campaignId) {
  return this.aggregate([
    { $match: { campaignId: mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: "$delivery.status",
        count: { $sum: 1 },
      },
    },
  ]);
};

// Static method to get engagement statistics
communicationLogSchema.statics.getEngagementStats = function (campaignId) {
  return this.aggregate([
    { $match: { campaignId: mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: null,
        totalSent: {
          $sum: {
            $cond: [{ $in: ["$delivery.status", ["sent", "delivered"]] }, 1, 0],
          },
        },
        totalOpened: {
          $sum: { $cond: ["$engagement.opened", 1, 0] },
        },
        totalClicked: {
          $sum: { $cond: ["$engagement.clicked", 1, 0] },
        },
        totalUnsubscribed: {
          $sum: { $cond: ["$engagement.unsubscribed", 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSent: 1,
        totalOpened: 1,
        totalClicked: 1,
        totalUnsubscribed: 1,
        openRate: {
          $cond: [
            { $gt: ["$totalSent", 0] },
            { $multiply: [{ $divide: ["$totalOpened", "$totalSent"] }, 100] },
            0,
          ],
        },
        clickRate: {
          $cond: [
            { $gt: ["$totalSent", 0] },
            { $multiply: [{ $divide: ["$totalClicked", "$totalSent"] }, 100] },
            0,
          ],
        },
        unsubscribeRate: {
          $cond: [
            { $gt: ["$totalSent", 0] },
            {
              $multiply: [
                { $divide: ["$totalUnsubscribed", "$totalSent"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
  ]);
};

// Static method to find pending deliveries for retry
communicationLogSchema.statics.findPendingRetries = function (maxRetries = 3) {
  return this.find({
    "delivery.status": "failed",
    "delivery.retryCount": { $lt: maxRetries },
  });
};

module.exports = mongoose.model("CommunicationLog", communicationLogSchema);
