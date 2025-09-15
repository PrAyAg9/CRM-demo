const express = require("express");
const { body, param, query } = require("express-validator");
const segmentationController = require("../controllers/segmentationController");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const segmentValidation = [
  body("name")
    .notEmpty()
    .withMessage("Segment name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Segment name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("ruleGroups")
    .isArray({ min: 1 })
    .withMessage("At least one rule group is required"),
  body("ruleGroups.*.logic")
    .isIn(["AND", "OR"])
    .withMessage("Rule group logic must be AND or OR"),
  body("ruleGroups.*.rules")
    .isArray({ min: 1 })
    .withMessage("Each rule group must have at least one rule"),
  body("ruleGroups.*.rules.*.field")
    .notEmpty()
    .withMessage("Field is required for each rule"),
  body("ruleGroups.*.rules.*.operator")
    .isIn([
      ">",
      "<",
      ">=",
      "<=",
      "=",
      "!=",
      "contains",
      "not_contains",
      "in",
      "not_in",
    ])
    .withMessage("Invalid operator"),
  body("ruleGroups.*.rules.*.dataType")
    .isIn(["number", "string", "date", "array"])
    .withMessage("Invalid data type"),
  body("naturalLanguageQuery")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Natural language query cannot exceed 1000 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().withMessage("Each tag must be a string"),
];

const previewValidation = [
  body("ruleGroups")
    .isArray({ min: 1 })
    .withMessage("At least one rule group is required"),
  body("ruleGroups.*.logic")
    .isIn(["AND", "OR"])
    .withMessage("Rule group logic must be AND or OR"),
  body("ruleGroups.*.rules")
    .isArray({ min: 1 })
    .withMessage("Each rule group must have at least one rule"),
];

/**
 * @swagger
 * /segmentation:
 *   post:
 *     summary: Create a new segment
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Segment'
 *           example:
 *             name: "High Value Customers"
 *             description: "Customers who spent more than 10,000 INR"
 *             ruleGroups:
 *               - logic: "AND"
 *                 rules:
 *                   - field: "totalSpending"
 *                     operator: ">"
 *                     value: 10000
 *                     dataType: "number"
 *             tags: ["high-value", "priority"]
 *     responses:
 *       201:
 *         description: Segment created successfully
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
 *                   $ref: '#/components/schemas/Segment'
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  segmentValidation,
  handleValidationErrors,
  segmentationController.createSegment
);

/**
 * @swagger
 * /segmentation:
 *   get:
 *     summary: Get all segments for the current user
 *     tags: [Segmentation]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in segment name and description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *     responses:
 *       200:
 *         description: List of segments
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
 *                     segments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Segment'
 *                     pagination:
 *                       type: object
 */
router.get("/", segmentationController.getSegments);

/**
 * @swagger
 * /segmentation/preview:
 *   post:
 *     summary: Preview audience size for given rules
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ruleGroups:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     logic:
 *                       type: string
 *                       enum: [AND, OR]
 *                     rules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           operator:
 *                             type: string
 *                           value: {}
 *                           dataType:
 *                             type: string
 *           example:
 *             ruleGroups:
 *               - logic: "AND"
 *                 rules:
 *                   - field: "totalSpending"
 *                     operator: ">"
 *                     value: 5000
 *                     dataType: "number"
 *                   - field: "totalVisits"
 *                     operator: "<"
 *                     value: 3
 *                     dataType: "number"
 *     responses:
 *       200:
 *         description: Audience preview with size and sample customers
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
 *                     audienceSize:
 *                       type: number
 *                     sampleCustomers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     previewedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid rule groups
 */
router.post(
  "/preview",
  previewValidation,
  handleValidationErrors,
  segmentationController.previewAudience
);

/**
 * @swagger
 * /segmentation/field-options:
 *   get:
 *     summary: Get available field options for rule building
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available fields and operators for segment rules
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
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           label:
 *                             type: string
 *                           type:
 *                             type: string
 *                           operators:
 *                             type: array
 *                             items:
 *                               type: string
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                     operators:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 */
router.get("/field-options", segmentationController.getFieldOptions);

/**
 * @swagger
 * /segmentation/recalculate:
 *   post:
 *     summary: Recalculate audience sizes for all segments
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Segments recalculated successfully
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
 *                     totalSegments:
 *                       type: number
 *                     updatedSegments:
 *                       type: number
 */
router.post("/recalculate", segmentationController.recalculateAllSegments);

/**
 * @swagger
 * /segmentation/{segmentId}:
 *   get:
 *     summary: Get segment by ID
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: segmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Segment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Segment'
 *       404:
 *         description: Segment not found
 */
router.get("/:segmentId", segmentationController.getSegment);

/**
 * @swagger
 * /segmentation/{segmentId}:
 *   put:
 *     summary: Update segment
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: segmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Segment'
 *     responses:
 *       200:
 *         description: Segment updated successfully
 *       404:
 *         description: Segment not found
 *       400:
 *         description: Validation error
 */
router.put(
  "/:segmentId",
  segmentValidation,
  handleValidationErrors,
  segmentationController.updateSegment
);

/**
 * @swagger
 * /segmentation/{segmentId}:
 *   delete:
 *     summary: Delete (deactivate) segment
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: segmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Segment deleted successfully
 *       404:
 *         description: Segment not found
 */
router.delete("/:segmentId", segmentationController.deleteSegment);

/**
 * @swagger
 * /segmentation/{segmentId}/customers:
 *   get:
 *     summary: Get customers in a segment
 *     tags: [Segmentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: segmentId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Customers in the segment
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
 *       404:
 *         description: Segment not found
 */
router.get("/:segmentId/customers", segmentationController.getSegmentCustomers);

module.exports = router;
