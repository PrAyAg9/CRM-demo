const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      // Temporarily use simpler email validation
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email",
      },
    },
    phone: {
      type: String,
      // Temporarily disable validation
      // validate: {
      //   validator: function (v) {
      //     return /\d{10}/.test(v);
      //   },
      //   message: "Please enter a valid phone number",
      // },
    },
    totalSpending: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisit: {
      type: Date,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    segments: [
      {
        type: String,
      },
    ],
    preferences: {
      communicationChannel: {
        type: String,
        enum: ["email", "sms", "both"],
        default: "email",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // AI-generated insights
    aiInsights: {
      lifetimeValue: Number,
      churnRisk: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
      },
      preferredCategories: [String],
      lastAnalyzed: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
customerSchema.index({ customerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ totalSpending: -1 });
customerSchema.index({ totalVisits: -1 });
customerSchema.index({ lastVisit: -1 });
customerSchema.index({ registrationDate: -1 });
customerSchema.index({ segments: 1 });
customerSchema.index({ "aiInsights.churnRisk": 1 });

// Virtual for days since last visit
customerSchema.virtual("daysSinceLastVisit").get(function () {
  if (!this.lastVisit) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.lastVisit);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if customer is inactive
customerSchema.methods.isInactive = function (days = 90) {
  const daysSince = this.daysSinceLastVisit;
  return daysSince !== null && daysSince > days;
};

// Static method to find customers by spending range
customerSchema.statics.findBySpendingRange = function (min, max) {
  return this.find({
    totalSpending: { $gte: min, $lte: max },
  });
};

module.exports = mongoose.model("Customer", customerSchema);
