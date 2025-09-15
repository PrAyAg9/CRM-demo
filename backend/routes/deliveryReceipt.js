const express = require("express");
const router = express.Router();
const deliveryReceiptController = require("../controllers/deliveryReceiptController");
const {
  validateDeliveryReceipt,
  validateBatchDeliveryReceipts,
} = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     DeliveryReceipt:
 *       type: object
 *       required:
 *         - vendorMessageId
 *         - status
 *         - campaignId
 *         - customerId
 *       properties:
 *         vendorMessageId:
 *           type: string
 *           description: Unique message ID from vendor
 *         status:
 *           type: string
 *           enum: [sent, delivered, failed, bounced, opened, clicked, unsubscribed]
 *         campaignId:
 *           type: string
 *           description: Associated campaign ID
 *         customerId:
 *           type: string
 *           description: Associated customer ID
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           description: Delivery timestamp
 *         errorMessage:
 *           type: string
 *           description: Error message for failed deliveries
 *         statusCode:
 *           type: string
 *           description: Vendor-specific status code
 *         openedAt:
 *           type: string
 *           format: date-time
 *           description: Email open timestamp
 *         clickedAt:
 *           type: string
 *           format: date-time
 *           description: Click timestamp
 *         unsubscribedAt:
 *           type: string
 *           format: date-time
 *           description: Unsubscribe timestamp
 *
 *     BatchDeliveryReceipts:
 *       type: object
 *       required:
 *         - receipts
 *       properties:
 *         receipts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DeliveryReceipt'
 *           maxItems: 1000
 *
 *     DeliveryStatus:
 *       type: object
 *       properties:
 *         vendorMessageId:
 *           type: string
 *         status:
 *           type: string
 *         channel:
 *           type: string
 *         sentAt:
 *           type: string
 *           format: date-time
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *         openedAt:
 *           type: string
 *           format: date-time
 *         clickedAt:
 *           type: string
 *           format: date-time
 *         unsubscribedAt:
 *           type: string
 *           format: date-time
 *         customer:
 *           type: object
 *         campaign:
 *           type: object
 *         metadata:
 *           type: object
 */

/**
 * @swagger
 * /api/delivery-receipt:
 *   post:
 *     summary: Process delivery receipt from vendor (webhook endpoint)
 *     tags: [Delivery Receipts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryReceipt'
 *     responses:
 *       200:
 *         description: Delivery receipt processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data or missing required fields
 *       404:
 *         description: Communication log not found for the provided vendor message ID
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  validateDeliveryReceipt,
  deliveryReceiptController.processDeliveryReceipt
);

/**
 * @swagger
 * /api/delivery-receipt/batch:
 *   post:
 *     summary: Process batch delivery receipts from vendor
 *     tags: [Delivery Receipts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchDeliveryReceipts'
 *     responses:
 *       200:
 *         description: Batch delivery receipts processed successfully
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
 *                     processed:
 *                       type: number
 *                     total:
 *                       type: number
 *                     errorCount:
 *                       type: number
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           index:
 *                             type: number
 *                           vendorMessageId:
 *                             type: string
 *                           error:
 *                             type: string
 *       400:
 *         description: Invalid request data or batch too large
 *       500:
 *         description: Server error
 */
router.post(
  "/batch",
  validateBatchDeliveryReceipts,
  deliveryReceiptController.processBatchDeliveryReceipts
);

/**
 * @swagger
 * /api/delivery-receipt/status/{vendorMessageId}:
 *   get:
 *     summary: Get delivery status for a specific message
 *     tags: [Delivery Receipts]
 *     parameters:
 *       - in: path
 *         name: vendorMessageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor message ID to check status for
 *     responses:
 *       200:
 *         description: Delivery status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryStatus'
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.get(
  "/status/:vendorMessageId",
  deliveryReceiptController.getDeliveryStatus
);

/**
 * @swagger
 * /api/delivery-receipt/campaign/{campaignId}/stats:
 *   get:
 *     summary: Get delivery statistics for a campaign
 *     tags: [Delivery Receipts]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID to get statistics for
 *     responses:
 *       200:
 *         description: Campaign delivery statistics retrieved successfully
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
 *                     totalSent:
 *                       type: number
 *                     delivered:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     bounced:
 *                       type: number
 *                     opened:
 *                       type: number
 *                     clicked:
 *                       type: number
 *                     unsubscribed:
 *                       type: number
 *                     deliveryRate:
 *                       type: string
 *                     openRate:
 *                       type: string
 *                     clickRate:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get(
  "/campaign/:campaignId/stats",
  deliveryReceiptController.getCampaignDeliveryStats
);

module.exports = router;
