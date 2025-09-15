const express = require("express");
const { body, param, query } = require("express-validator");
const campaignController = require("../controllers/campaignController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const campaignValidation = [
  body("name")
    .notEmpty()
    .withMessage("Campaign name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Campaign name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("segmentId")
    .notEmpty()
    .withMessage("Segment ID is required")
    .isMongoId()
    .withMessage("Invalid segment ID"),
  body("message.content")
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message content must be between 10 and 2000 characters"),
  body("message.subject")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Subject cannot exceed 200 characters"),
  body("message.template")
    .optional()
    .isIn(["default", "promotional", "transactional", "reminder"])
    .withMessage("Invalid message template"),
  body("delivery.channel")
    .optional()
    .isIn(["email", "sms", "both"])
    .withMessage("Invalid delivery channel"),
  body("delivery.scheduledAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid scheduled date"),
  body("delivery.priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority level"),
  body("targeting.excludeUnsubscribed")
    .optional()
    .isBoolean()
    .withMessage("Exclude unsubscribed must be a boolean"),
  body("targeting.testPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Test percentage must be between 0 and 100"),
  body("budget.maxCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max cost must be a positive number"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().withMessage("Each tag must be a string"),
];

const duplicateValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Campaign name must be between 2 and 100 characters"),
];

/**
 * @swagger
 * /campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *           example:
 *             name: "Summer Sale Campaign"
 *             description: "Promote summer collection to high-value customers"
 *             segmentId: "60f1b2e4c8d1a2b3c4d5e6f7"
 *             message:
 *               content: "Hi {{name}}, enjoy 20% off on our summer collection!"
 *               subject: "Exclusive Summer Sale - 20% Off!"
 *               template: "promotional"
 *             delivery:
 *               channel: "email"
 *               scheduledAt: "2025-09-15T10:00:00Z"
 *               priority: "high"
 *             targeting:
 *               excludeUnsubscribed: true
 *               testPercentage: 10
 *             budget:
 *               maxCost: 1000
 *             tags: ["summer", "sale", "high-value"]
 *     responses:
 *       201:
 *         description: Campaign created successfully
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
 *                   $ref: '#/components/schemas/Campaign'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Segment not found
 */
router.post(
  "/",
  campaignValidation,
  handleValidationErrors,
  campaignController.createCampaign
);

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Get all campaigns for the current user
 *     tags: [Campaigns]
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sending, sent, failed, cancelled]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in campaign name and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of campaigns
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
 *                     campaigns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Campaign'
 *                     pagination:
 *                       type: object
 */
router.get("/", campaignController.getCampaigns);

/**
 * @swagger
 * /campaigns/analytics:
 *   get:
 *     summary: Get campaign analytics for the current user
 *     tags: [Campaigns]
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
 *         description: Campaign analytics data
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
 *                     statusDistribution:
 *                       type: array
 *                     topCampaigns:
 *                       type: array
 */
router.get("/analytics", campaignController.getCampaignAnalytics);

/**
 * @swagger
 * /campaigns/{campaignId}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 */
router.get("/:campaignId", campaignController.getCampaign);

/**
 * @swagger
 * /campaigns/{campaignId}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Campaign cannot be edited or validation error
 *       404:
 *         description: Campaign not found
 */
router.put(
  "/:campaignId",
  campaignValidation,
  handleValidationErrors,
  campaignController.updateCampaign
);

/**
 * @swagger
 * /campaigns/{campaignId}:
 *   delete:
 *     summary: Cancel campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign cancelled successfully
 *       400:
 *         description: Campaign cannot be cancelled
 *       404:
 *         description: Campaign not found
 */
router.delete("/:campaignId", campaignController.deleteCampaign);

/**
 * @swagger
 * /campaigns/{campaignId}/send:
 *   post:
 *     summary: Send campaign immediately
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign sending initiated
 *       400:
 *         description: Campaign cannot be sent
 *       404:
 *         description: Campaign not found
 */
router.post("/:campaignId/send", campaignController.sendCampaign);

/**
 * @swagger
 * /campaigns/{campaignId}/stats:
 *   get:
 *     summary: Get detailed campaign statistics
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed campaign statistics
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
 *                     campaign:
 *                       type: object
 *                     deliveryStats:
 *                       type: array
 *                     engagementStats:
 *                       type: object
 *                     deliveryTimeline:
 *                       type: array
 *       404:
 *         description: Campaign not found
 */
router.get("/:campaignId/stats", campaignController.getCampaignStats);

/**
 * @swagger
 * /campaigns/{campaignId}/duplicate:
 *   post:
 *     summary: Duplicate campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the duplicated campaign
 *     responses:
 *       201:
 *         description: Campaign duplicated successfully
 *       404:
 *         description: Campaign not found
 */
router.post(
  "/:campaignId/duplicate",
  duplicateValidation,
  handleValidationErrors,
  campaignController.duplicateCampaign
);

module.exports = router;
