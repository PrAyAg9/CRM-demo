const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const {
  validateVendorSimulation,
  validateBulkMessages,
  validateRecipientValidation,
} = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     VendorDeliveryRequest:
 *       type: object
 *       required:
 *         - recipient
 *         - message
 *       properties:
 *         recipient:
 *           type: string
 *           description: Recipient email or phone number
 *         message:
 *           type: string
 *           description: Message content
 *         channel:
 *           type: string
 *           enum: [email, sms]
 *           default: email
 *         campaignId:
 *           type: string
 *           description: Associated campaign ID
 *         customerId:
 *           type: string
 *           description: Associated customer ID
 *
 *     BulkMessageRequest:
 *       type: object
 *       required:
 *         - messages
 *       properties:
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VendorDeliveryRequest'
 *           maxItems: 1000
 *
 *     VendorResponse:
 *       type: object
 *       properties:
 *         vendorMessageId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [sent, failed]
 *         recipient:
 *           type: string
 *         channel:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         error:
 *           type: string
 *         errorCode:
 *           type: string
 *
 *     VendorStatus:
 *       type: object
 *       properties:
 *         service:
 *           type: string
 *         version:
 *           type: string
 *         status:
 *           type: string
 *         uptime:
 *           type: number
 *         capabilities:
 *           type: object
 *         rates:
 *           type: object
 *         limits:
 *           type: object
 *         successRate:
 *           type: string
 *         averageDeliveryTime:
 *           type: string
 */

/**
 * @swagger
 * /api/vendor/simulate-delivery:
 *   post:
 *     summary: Simulate message delivery via vendor API
 *     tags: [Vendor Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VendorDeliveryRequest'
 *     responses:
 *       200:
 *         description: Message delivery simulated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VendorResponse'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  "/simulate-delivery",
  validateVendorSimulation,
  vendorController.simulateDelivery
);

/**
 * @swagger
 * /api/vendor/bulk-send:
 *   post:
 *     summary: Send bulk messages (batch processing)
 *     tags: [Vendor Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkMessageRequest'
 *     responses:
 *       200:
 *         description: Bulk messages processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         sent:
 *                           type: number
 *                         failed:
 *                           type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VendorResponse'
 *       400:
 *         description: Invalid request data or batch too large
 *       500:
 *         description: Server error
 */
router.post(
  "/bulk-send",
  validateBulkMessages,
  vendorController.sendBulkMessages
);

/**
 * @swagger
 * /api/vendor/status:
 *   get:
 *     summary: Get vendor API status and configuration
 *     tags: [Vendor Simulation]
 *     responses:
 *       200:
 *         description: Vendor status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VendorStatus'
 *       500:
 *         description: Server error
 */
router.get("/status", vendorController.getVendorStatus);

/**
 * @swagger
 * /api/vendor/validate-recipients:
 *   post:
 *     summary: Validate recipient addresses
 *     tags: [Vendor Simulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               channel:
 *                 type: string
 *                 enum: [email, sms]
 *                 default: email
 *     responses:
 *       200:
 *         description: Recipients validated successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         valid:
 *                           type: number
 *                         invalid:
 *                           type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           recipient:
 *                             type: string
 *                           isValid:
 *                             type: boolean
 *                           reason:
 *                             type: string
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  "/validate-recipients",
  validateRecipientValidation,
  vendorController.validateRecipients
);

/**
 * @swagger
 * /api/vendor/analytics:
 *   get:
 *     summary: Get delivery analytics from vendor
 *     tags: [Vendor Simulation]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days for analytics period
 *     responses:
 *       200:
 *         description: Delivery analytics retrieved successfully
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
 *                     period:
 *                       type: string
 *                     totalMessages:
 *                       type: number
 *                     delivered:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     bounced:
 *                       type: number
 *                     deliveryRate:
 *                       type: number
 *                     averageDeliveryTime:
 *                       type: number
 *                     topFailureReasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                           count:
 *                             type: number
 *                     dailyVolume:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           sent:
 *                             type: number
 *                           delivered:
 *                             type: number
 *                           failed:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get("/analytics", vendorController.getDeliveryAnalytics);

module.exports = router;
