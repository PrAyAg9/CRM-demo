const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const {
  validateAINaturalLanguage,
  validateAIMessageGeneration,
  validateAISegmentPreview,
} = require("../middleware/validation");
const { authMiddleware } = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     NaturalLanguageRequest:
 *       type: object
 *       required:
 *         - description
 *       properties:
 *         description:
 *           type: string
 *           example: "customers who spent more than 1000 in the last 30 days"
 *           description: Natural language description of the segment
 *
 *     SegmentRulesResponse:
 *       type: object
 *       properties:
 *         originalText:
 *           type: string
 *         mongoQuery:
 *           type: object
 *           description: MongoDB query object
 *         description:
 *           type: string
 *         estimatedImpact:
 *           type: string
 *         confidence:
 *           type: string
 *           enum: [high, medium, low]
 *
 *     MessageGenerationRequest:
 *       type: object
 *       required:
 *         - campaignType
 *         - audienceDescription
 *       properties:
 *         campaignType:
 *           type: string
 *           enum: [promotional, transactional, nurture, announcement]
 *         audienceDescription:
 *           type: string
 *           example: "High-value customers who haven't ordered in 30 days"
 *         context:
 *           type: object
 *           properties:
 *             product:
 *               type: string
 *             offer:
 *               type: string
 *             deadline:
 *               type: string
 *
 *     MessageSuggestion:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         tone:
 *           type: string
 *         cta:
 *           type: string
 *         rationale:
 *           type: string
 *
 *     SegmentPreviewRequest:
 *       type: object
 *       required:
 *         - rules
 *       properties:
 *         rules:
 *           type: object
 *           description: MongoDB query rules to preview
 *
 *     CampaignAnalysis:
 *       type: object
 *       properties:
 *         summary:
 *           type: string
 *         strengths:
 *           type: array
 *           items:
 *             type: string
 *         weaknesses:
 *           type: array
 *           items:
 *             type: string
 *         recommendations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               suggestion:
 *                 type: string
 *               expectedImpact:
 *                 type: string
 *               priority:
 *                 type: string
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *
 *     CustomerInsights:
 *       type: object
 *       properties:
 *         profile:
 *           type: string
 *         segments:
 *           type: array
 *           items:
 *             type: string
 *         preferences:
 *           type: object
 *         predictions:
 *           type: object
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/ai/convert-to-rules:
 *   post:
 *     summary: Convert natural language to segment rules using AI
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NaturalLanguageRequest'
 *     responses:
 *       200:
 *         description: Successfully converted natural language to rules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SegmentRulesResponse'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  "/convert-to-rules",
  authMiddleware,
  validateAINaturalLanguage,
  aiController.convertToRules
);

/**
 * @swagger
 * /api/ai/preview-segment:
 *   post:
 *     summary: Preview segment rules and get customer count
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SegmentPreviewRequest'
 *     responses:
 *       200:
 *         description: Segment preview generated successfully
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
 *                     count:
 *                       type: number
 *                     sampleCustomers:
 *                       type: array
 *                     rules:
 *                       type: object
 *                     preview:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  "/preview-segment",
  authMiddleware,
  validateAISegmentPreview,
  aiController.previewSegment
);

/**
 * @swagger
 * /api/ai/generate-messages:
 *   post:
 *     summary: Generate AI-powered message suggestions for campaigns
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageGenerationRequest'
 *     responses:
 *       200:
 *         description: Message suggestions generated successfully
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
 *                     campaignType:
 *                       type: string
 *                     audience:
 *                       type: string
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MessageSuggestion'
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post(
  "/generate-messages",
  authMiddleware,
  validateAIMessageGeneration,
  aiController.generateMessages
);

/**
 * @swagger
 * /api/ai/analyze-campaign/{campaignId}:
 *   get:
 *     summary: Analyze campaign performance with AI insights
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID to analyze
 *     responses:
 *       200:
 *         description: Campaign analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/CampaignAnalysis'
 *                     - type: object
 *                       properties:
 *                         performanceData:
 *                           type: object
 *                         benchmarks:
 *                           type: object
 *                         analyzedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.get(
  "/analyze-campaign/:campaignId",
  authMiddleware,
  aiController.analyzeCampaign
);

/**
 * @swagger
 * /api/ai/customer-insights/{customerId}:
 *   get:
 *     summary: Generate AI-powered customer behavioral insights
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID to analyze
 *     responses:
 *       200:
 *         description: Customer insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/CustomerInsights'
 *                     - type: object
 *                       properties:
 *                         customerId:
 *                           type: string
 *                         customerData:
 *                           type: object
 *                         analyzedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.get(
  "/customer-insights/:customerId",
  authMiddleware,
  aiController.getCustomerInsights
);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Get AI service status and capabilities
 *     tags: [AI Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status retrieved successfully
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
 *                     available:
 *                       type: boolean
 *                     capabilities:
 *                       type: object
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 *                     limitations:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get("/status", authMiddleware, aiController.getAIStatus);

module.exports = router;
