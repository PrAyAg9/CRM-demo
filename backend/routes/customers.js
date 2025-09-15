const express = require("express");
const { body, param, query } = require("express-validator");
const customerController = require("../controllers/customerController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const customerValidation = [
  body("customerId")
    .notEmpty()
    .withMessage("Customer ID is required")
    .isString()
    .withMessage("Customer ID must be a string"),
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("phone")
    .optional()
    .isMobilePhone("any")
    .withMessage("Invalid phone number"),
  body("totalSpending")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total spending must be a positive number"),
  body("totalVisits")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Total visits must be a positive integer"),
  body("lastVisit")
    .optional()
    .isISO8601()
    .withMessage("Last visit must be a valid date"),
  body("registrationDate")
    .optional()
    .isISO8601()
    .withMessage("Registration date must be a valid date"),
  body("preferences.communicationChannel")
    .optional()
    .isIn(["email", "sms", "both"])
    .withMessage("Communication channel must be email, sms, or both"),
  body("address.zipCode")
    .optional()
    .isPostalCode("any")
    .withMessage("Invalid zip code"),
];

const bulkCustomerValidation = [
  body("customers")
    .isArray({ min: 1, max: 1000 })
    .withMessage("Customers must be an array with 1-1000 items"),
  body("customers.*.customerId")
    .notEmpty()
    .withMessage("Each customer must have a customerId"),
  body("customers.*.name")
    .notEmpty()
    .withMessage("Each customer must have a name"),
  body("customers.*.email")
    .isEmail()
    .withMessage("Each customer must have a valid email"),
];

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *           example:
 *             customerId: "CUST001"
 *             name: "John Doe"
 *             email: "john.doe@example.com"
 *             phone: "+919876543210"
 *             totalSpending: 25000
 *             totalVisits: 5
 *             preferences:
 *               communicationChannel: "email"
 *             address:
 *               city: "Mumbai"
 *               country: "India"
 *     responses:
 *       202:
 *         description: Customer creation request accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  "/",
  // Temporarily disable validation to test
  // customerValidation,
  // handleValidationErrors,
  customerController.createCustomer
);

/**
 * @swagger
 * /customers/bulk:
 *   post:
 *     summary: Create multiple customers in bulk
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Customer'
 *                 maxItems: 1000
 *           example:
 *             customers:
 *               - customerId: "CUST001"
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *               - customerId: "CUST002"
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *     responses:
 *       202:
 *         description: Bulk creation request accepted
 *       400:
 *         description: Validation error
 */
router.post(
  "/bulk",
  bulkCustomerValidation,
  handleValidationErrors,
  customerController.createCustomersBulk
);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get customers with filtering and pagination
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, or customer ID
 *       - in: query
 *         name: segments
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by segments
 *       - in: query
 *         name: minSpending
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxSpending
 *         schema:
 *           type: number
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of customers
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     pagination:
 *                       type: object
 */
router.get("/", customerController.getCustomers);

/**
 * @swagger
 * /customers/analytics:
 *   get:
 *     summary: Get customer analytics and insights
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer analytics data
 */
router.get("/analytics", customerController.getCustomerAnalytics);

/**
 * @swagger
 * /customers/stats:
 *   get:
 *     summary: Get customer statistics for dashboard
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics
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
 *                     totalCustomers:
 *                       type: number
 *                     newCustomersThisMonth:
 *                       type: number
 *                     totalRevenue:
 *                       type: number
 *                     activeCustomers:
 *                       type: number
 */
router.get("/stats", customerController.getCustomerStats);

/**
 * @swagger
 * /customers/{customerId}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 */
router.get("/:customerId", customerController.getCustomer);

/**
 * @swagger
 * /customers/{customerId}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put(
  "/:customerId",
  customerValidation,
  handleValidationErrors,
  customerController.updateCustomer
);

/**
 * @swagger
 * /customers/{customerId}:
 *   delete:
 *     summary: Delete (deactivate) customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deactivated successfully
 *       404:
 *         description: Customer not found
 */
router.delete("/:customerId", customerController.deleteCustomer);

module.exports = router;
