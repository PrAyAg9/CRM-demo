const { validationResult, body, param, query } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: "Duplicate entry",
      message: `${field} already exists`,
    });
  }

  // Mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid data format",
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Vendor simulation validation
const validateVendorSimulation = [
  body("recipient")
    .notEmpty()
    .withMessage("Recipient is required")
    .isLength({ min: 3 })
    .withMessage("Recipient must be at least 3 characters"),
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),
  body("channel")
    .optional()
    .isIn(["email", "sms"])
    .withMessage("Channel must be either email or sms"),
  body("campaignId").optional().isMongoId().withMessage("Invalid campaign ID"),
  body("customerId").optional().isMongoId().withMessage("Invalid customer ID"),
  handleValidationErrors,
];

// Bulk messages validation
const validateBulkMessages = [
  body("messages")
    .isArray({ min: 1, max: 1000 })
    .withMessage("Messages must be an array with 1-1000 items"),
  body("messages.*.recipient")
    .notEmpty()
    .withMessage("Each message must have a recipient"),
  body("messages.*.message")
    .notEmpty()
    .withMessage("Each message must have content"),
  body("messages.*.channel")
    .optional()
    .isIn(["email", "sms"])
    .withMessage("Channel must be either email or sms"),
  handleValidationErrors,
];

// Recipient validation
const validateRecipientValidation = [
  body("recipients")
    .isArray({ min: 1 })
    .withMessage("Recipients must be a non-empty array"),
  body("channel")
    .optional()
    .isIn(["email", "sms"])
    .withMessage("Channel must be either email or sms"),
  handleValidationErrors,
];

// Delivery receipt validation
const validateDeliveryReceipt = [
  body("vendorMessageId")
    .notEmpty()
    .withMessage("Vendor message ID is required"),
  body("status")
    .isIn([
      "sent",
      "delivered",
      "failed",
      "bounced",
      "opened",
      "clicked",
      "unsubscribed",
    ])
    .withMessage("Invalid status"),
  body("campaignId").isMongoId().withMessage("Invalid campaign ID"),
  body("customerId").isMongoId().withMessage("Invalid customer ID"),
  body("deliveredAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid delivery date format"),
  body("openedAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid opened date format"),
  body("clickedAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid clicked date format"),
  body("unsubscribedAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid unsubscribed date format"),
  handleValidationErrors,
];

// Batch delivery receipts validation
const validateBatchDeliveryReceipts = [
  body("receipts")
    .isArray({ min: 1, max: 1000 })
    .withMessage("Receipts must be an array with 1-1000 items"),
  body("receipts.*.vendorMessageId")
    .notEmpty()
    .withMessage("Each receipt must have a vendor message ID"),
  body("receipts.*.status")
    .isIn([
      "sent",
      "delivered",
      "failed",
      "bounced",
      "opened",
      "clicked",
      "unsubscribed",
    ])
    .withMessage("Invalid status in receipt"),
  body("receipts.*.campaignId")
    .isMongoId()
    .withMessage("Invalid campaign ID in receipt"),
  body("receipts.*.customerId")
    .isMongoId()
    .withMessage("Invalid customer ID in receipt"),
  handleValidationErrors,
];

// AI natural language validation
const validateAINaturalLanguage = [
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  handleValidationErrors,
];

// AI message generation validation
const validateAIMessageGeneration = [
  body("campaignType")
    .isIn(["promotional", "transactional", "nurture", "announcement"])
    .withMessage("Invalid campaign type"),
  body("audienceDescription")
    .notEmpty()
    .withMessage("Audience description is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Audience description must be between 5 and 200 characters"),
  body("context")
    .optional()
    .isObject()
    .withMessage("Context must be an object"),
  handleValidationErrors,
];

// AI segment preview validation
const validateAISegmentPreview = [
  body("rules")
    .isObject()
    .withMessage("Rules must be an object")
    .notEmpty()
    .withMessage("Rules cannot be empty"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  errorHandler,
  validateVendorSimulation,
  validateBulkMessages,
  validateRecipientValidation,
  validateDeliveryReceipt,
  validateBatchDeliveryReceipts,
  validateAINaturalLanguage,
  validateAIMessageGeneration,
  validateAISegmentPreview,
};
