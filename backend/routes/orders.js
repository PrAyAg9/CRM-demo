const express = require("express");
const { body, param, query } = require("express-validator");
const orderController = require("../controllers/orderController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const orderValidation = [
  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
  body("customerId")
    .notEmpty()
    .withMessage("Customer ID is required")
    .isString()
    .withMessage("Customer ID must be a string"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code"),
  body("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .withMessage("Invalid order status"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("Items array is required and cannot be empty"),
  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required for each item"),
  body("items.*.productName")
    .notEmpty()
    .withMessage("Product name is required for each item"),
  body("items.*.category")
    .notEmpty()
    .withMessage("Category is required for each item"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number"),
  body("items.*.totalPrice")
    .isFloat({ min: 0 })
    .withMessage("Total price must be a positive number"),
  body("paymentMethod")
    .isIn([
      "credit_card",
      "debit_card",
      "upi",
      "net_banking",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment method"),
  body("orderDate")
    .optional()
    .isISO8601()
    .withMessage("Order date must be a valid date"),
  body("discountApplied")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a positive number"),
  body("taxAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax amount must be a positive number"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
];

const bulkOrderValidation = [
  body("orders")
    .isArray({ min: 1, max: 500 })
    .withMessage("Orders must be an array with 1-500 items"),
  body("orders.*.orderId")
    .notEmpty()
    .withMessage("Each order must have an orderId"),
  body("orders.*.customerId")
    .notEmpty()
    .withMessage("Each order must have a customerId"),
  body("orders.*.amount")
    .isFloat({ min: 0 })
    .withMessage("Each order must have a valid amount"),
  body("orders.*.items")
    .isArray({ min: 1 })
    .withMessage("Each order must have items"),
];

const orderStatusValidation = [
  body("status")
    .isIn([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .withMessage("Invalid order status"),
  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *           example:
 *             orderId: "ORD001"
 *             customerId: "CUST001"
 *             amount: 2500
 *             currency: "INR"
 *             status: "confirmed"
 *             items:
 *               - productId: "PROD001"
 *                 productName: "iPhone 15"
 *                 category: "Electronics"
 *                 quantity: 1
 *                 unitPrice: 2500
 *                 totalPrice: 2500
 *             paymentMethod: "credit_card"
 *             taxAmount: 250
 *             shippingCost: 100
 *     responses:
 *       202:
 *         description: Order creation request accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  orderValidation,
  handleValidationErrors,
  orderController.createOrder
);

/**
 * @swagger
 * /orders/bulk:
 *   post:
 *     summary: Create multiple orders in bulk
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Order'
 *                 maxItems: 500
 *     responses:
 *       202:
 *         description: Bulk creation request accepted
 *       400:
 *         description: Validation error
 */
router.post(
  "/bulk",
  bulkOrderValidation,
  handleValidationErrors,
  orderController.createOrdersBulk
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get orders with filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       type: object
 */
router.get("/", orderController.getOrders);

/**
 * @swagger
 * /orders/analytics:
 *   get:
 *     summary: Get order analytics and insights
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days for analytics period
 *     responses:
 *       200:
 *         description: Order analytics data
 */
router.get("/analytics", orderController.getOrderAnalytics);

/**
 * @swagger
 * /orders/customer/{customerId}:
 *   get:
 *     summary: Get orders for a specific customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Customer order history
 *       404:
 *         description: Customer not found
 */
router.get("/customer/:customerId", orderController.getCustomerOrders);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get("/:orderId", orderController.getOrder);

/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled, refunded]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
router.patch(
  "/:orderId/status",
  orderStatusValidation,
  handleValidationErrors,
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/{orderId}:
 *   delete:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found or cannot be cancelled
 */
router.delete("/:orderId", orderController.deleteOrder);

module.exports = router;
