const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: String,
      required: true,
      ref: "Customer",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "upi",
        "net_banking",
        "cash_on_delivery",
      ],
      required: true,
    },
    discountApplied: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
orderSchema.index({ orderId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ amount: -1 });
orderSchema.index({ "items.category": 1 });

// Virtual for total order value (including tax and shipping)
orderSchema.virtual("totalValue").get(function () {
  return (
    this.amount + this.taxAmount + this.shippingCost - this.discountApplied
  );
});

// Pre-save middleware to calculate total amount
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.amount = this.items.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
  }
  next();
});

// Static method to get orders by date range
orderSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    orderDate: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

// Static method to get customer's order history
orderSchema.statics.findByCustomer = function (customerId) {
  return this.find({ customerId }).sort({ orderDate: -1 });
};

// Method to check if order is recent
orderSchema.methods.isRecent = function (days = 30) {
  const now = new Date();
  const diffTime = Math.abs(now - this.orderDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
};

module.exports = mongoose.model("Order", orderSchema);
