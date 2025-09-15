const { CommunicationLog, Campaign, Customer } = require("../models");
const redisService = require("../services/redisService");

class DeliveryReceiptController {
  /**
   * Process delivery receipt from vendor
   * This endpoint is called by vendor APIs via webhook
   */
  async processDeliveryReceipt(req, res) {
    try {
      const {
        vendorMessageId,
        status,
        campaignId,
        customerId,
        deliveredAt,
        errorMessage,
        statusCode,
        openedAt,
        clickedAt,
        unsubscribedAt,
      } = req.body;

      if (!vendorMessageId || !status || !campaignId || !customerId) {
        return res.status(400).json({
          error: "Missing required fields",
          message:
            "vendorMessageId, status, campaignId, and customerId are required",
        });
      }

      // Find the communication log entry
      const communicationLog = await CommunicationLog.findOne({
        campaignId,
        customerId,
        "metadata.vendorMessageId": vendorMessageId,
      });

      if (!communicationLog) {
        console.warn(
          `Communication log not found for vendorMessageId: ${vendorMessageId}`
        );
        return res.status(404).json({
          error: "Communication log not found",
          message:
            "No matching communication log found for this delivery receipt",
        });
      }

      // Update the communication log
      const updateData = {
        status,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
        updatedAt: new Date(),
      };

      if (errorMessage) {
        updateData["metadata.errorMessage"] = errorMessage;
      }

      if (statusCode) {
        updateData["metadata.statusCode"] = statusCode;
      }

      if (openedAt) {
        updateData.openedAt = new Date(openedAt);
      }

      if (clickedAt) {
        updateData.clickedAt = new Date(clickedAt);
      }

      if (unsubscribedAt) {
        updateData.unsubscribedAt = new Date(unsubscribedAt);
      }

      await CommunicationLog.findByIdAndUpdate(
        communicationLog._id,
        { $set: updateData },
        { new: true }
      );

      // Update campaign statistics
      await this.updateCampaignStats(campaignId, status);

      // Publish event to Redis for real-time updates
      await redisService.publishEvent("delivery-receipt", {
        vendorMessageId,
        campaignId,
        customerId,
        status,
        timestamp: new Date().toISOString(),
      });

      // Handle specific status types
      if (status === "delivered") {
        await this.handleDeliverySuccess(
          campaignId,
          customerId,
          communicationLog
        );
      } else if (status === "failed" || status === "bounced") {
        await this.handleDeliveryFailure(
          campaignId,
          customerId,
          communicationLog,
          errorMessage
        );
      } else if (status === "unsubscribed") {
        await this.handleUnsubscribe(customerId);
      }

      res.json({
        success: true,
        message: "Delivery receipt processed successfully",
      });
    } catch (error) {
      console.error("Process delivery receipt error:", error);
      res.status(500).json({
        error: "Failed to process delivery receipt",
        message: error.message,
      });
    }
  }

  /**
   * Process batch delivery receipts
   */
  async processBatchDeliveryReceipts(req, res) {
    try {
      const { receipts } = req.body;

      if (!Array.isArray(receipts) || receipts.length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "receipts array is required and cannot be empty",
        });
      }

      if (receipts.length > 1000) {
        return res.status(400).json({
          error: "Batch too large",
          message: "Maximum 1000 receipts per batch",
        });
      }

      const results = {
        processed: 0,
        errors: [],
      };

      // Process receipts in chunks to avoid memory issues
      const chunkSize = 100;
      for (let i = 0; i < receipts.length; i += chunkSize) {
        const chunk = receipts.slice(i, i + chunkSize);

        const chunkPromises = chunk.map(async (receipt, index) => {
          try {
            const actualIndex = i + index;
            const {
              vendorMessageId,
              status,
              campaignId,
              customerId,
              deliveredAt,
              errorMessage,
              statusCode,
            } = receipt;

            if (!vendorMessageId || !status || !campaignId || !customerId) {
              throw new Error("Missing required fields");
            }

            // Find and update communication log
            const communicationLog = await CommunicationLog.findOne({
              campaignId,
              customerId,
              "metadata.vendorMessageId": vendorMessageId,
            });

            if (!communicationLog) {
              throw new Error(
                `Communication log not found for vendorMessageId: ${vendorMessageId}`
              );
            }

            const updateData = {
              status,
              deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
              updatedAt: new Date(),
            };

            if (errorMessage) {
              updateData["metadata.errorMessage"] = errorMessage;
            }

            if (statusCode) {
              updateData["metadata.statusCode"] = statusCode;
            }

            await CommunicationLog.findByIdAndUpdate(communicationLog._id, {
              $set: updateData,
            });

            // Update campaign statistics
            await this.updateCampaignStats(campaignId, status);

            // Publish event
            await redisService.publishEvent("delivery-receipt", {
              vendorMessageId,
              campaignId,
              customerId,
              status,
              batchIndex: actualIndex,
              timestamp: new Date().toISOString(),
            });

            results.processed++;
          } catch (error) {
            results.errors.push({
              index: i + index,
              vendorMessageId: receipt.vendorMessageId,
              error: error.message,
            });
          }
        });

        await Promise.all(chunkPromises);
      }

      res.json({
        success: true,
        message: `Processed ${results.processed} receipts with ${results.errors.length} errors`,
        data: {
          processed: results.processed,
          total: receipts.length,
          errorCount: results.errors.length,
          errors: results.errors.slice(0, 10), // Return first 10 errors
        },
      });
    } catch (error) {
      console.error("Process batch delivery receipts error:", error);
      res.status(500).json({
        error: "Failed to process batch delivery receipts",
        message: error.message,
      });
    }
  }

  /**
   * Get delivery status for a specific message
   */
  async getDeliveryStatus(req, res) {
    try {
      const { vendorMessageId } = req.params;

      const communicationLog = await CommunicationLog.findOne({
        "metadata.vendorMessageId": vendorMessageId,
      })
        .populate("customerId", "firstName lastName email")
        .populate("campaignId", "name type");

      if (!communicationLog) {
        return res.status(404).json({
          error: "Message not found",
          message: "No message found with the provided vendor message ID",
        });
      }

      const deliveryStatus = {
        vendorMessageId,
        status: communicationLog.status,
        channel: communicationLog.channel,
        sentAt: communicationLog.sentAt,
        deliveredAt: communicationLog.deliveredAt,
        openedAt: communicationLog.openedAt,
        clickedAt: communicationLog.clickedAt,
        unsubscribedAt: communicationLog.unsubscribedAt,
        customer: communicationLog.customerId,
        campaign: communicationLog.campaignId,
        metadata: communicationLog.metadata,
      };

      res.json({
        success: true,
        data: deliveryStatus,
      });
    } catch (error) {
      console.error("Get delivery status error:", error);
      res.status(500).json({
        error: "Failed to get delivery status",
        message: error.message,
      });
    }
  }

  /**
   * Get delivery statistics for a campaign
   */
  async getCampaignDeliveryStats(req, res) {
    try {
      const { campaignId } = req.params;

      const pipeline = [
        { $match: { campaignId: campaignId } },
        {
          $group: {
            _id: null,
            totalSent: { $sum: 1 },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            bounced: {
              $sum: { $cond: [{ $eq: ["$status", "bounced"] }, 1, 0] },
            },
            opened: {
              $sum: { $cond: [{ $ne: ["$openedAt", null] }, 1, 0] },
            },
            clicked: {
              $sum: { $cond: [{ $ne: ["$clickedAt", null] }, 1, 0] },
            },
            unsubscribed: {
              $sum: { $cond: [{ $ne: ["$unsubscribedAt", null] }, 1, 0] },
            },
          },
        },
      ];

      const stats = await CommunicationLog.aggregate(pipeline);
      const campaignStats = stats[0] || {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
      };

      // Calculate rates
      campaignStats.deliveryRate =
        campaignStats.totalSent > 0
          ? ((campaignStats.delivered / campaignStats.totalSent) * 100).toFixed(
              2
            )
          : 0;

      campaignStats.openRate =
        campaignStats.delivered > 0
          ? ((campaignStats.opened / campaignStats.delivered) * 100).toFixed(2)
          : 0;

      campaignStats.clickRate =
        campaignStats.delivered > 0
          ? ((campaignStats.clicked / campaignStats.delivered) * 100).toFixed(2)
          : 0;

      res.json({
        success: true,
        data: campaignStats,
      });
    } catch (error) {
      console.error("Get campaign delivery stats error:", error);
      res.status(500).json({
        error: "Failed to get campaign delivery statistics",
        message: error.message,
      });
    }
  }

  /**
   * Update campaign statistics
   * @private
   */
  async updateCampaignStats(campaignId, status) {
    try {
      const updateField = {};

      switch (status) {
        case "delivered":
          updateField["stats.delivered"] = 1;
          break;
        case "failed":
          updateField["stats.failed"] = 1;
          break;
        case "bounced":
          updateField["stats.bounced"] = 1;
          break;
      }

      if (Object.keys(updateField).length > 0) {
        await Campaign.findByIdAndUpdate(
          campaignId,
          { $inc: updateField },
          { new: true }
        );
      }
    } catch (error) {
      console.error("Error updating campaign stats:", error);
    }
  }

  /**
   * Handle successful delivery
   * @private
   */
  async handleDeliverySuccess(campaignId, customerId, communicationLog) {
    try {
      // Update customer last engagement
      await Customer.findByIdAndUpdate(customerId, {
        lastEngagementAt: new Date(),
      });

      // Publish success event
      await redisService.publishEvent("delivery-success", {
        campaignId,
        customerId,
        channel: communicationLog.channel,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error handling delivery success:", error);
    }
  }

  /**
   * Handle delivery failure
   * @private
   */
  async handleDeliveryFailure(
    campaignId,
    customerId,
    communicationLog,
    errorMessage
  ) {
    try {
      // Check if we should suppress this customer for future campaigns
      const recentFailures = await CommunicationLog.countDocuments({
        customerId,
        status: { $in: ["failed", "bounced"] },
        sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      });

      if (recentFailures >= 3) {
        await Customer.findByIdAndUpdate(customerId, {
          "preferences.suppressUntil": new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ), // 30 days
        });
      }

      // Publish failure event
      await redisService.publishEvent("delivery-failure", {
        campaignId,
        customerId,
        channel: communicationLog.channel,
        errorMessage,
        recentFailures,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error handling delivery failure:", error);
    }
  }

  /**
   * Handle unsubscribe
   * @private
   */
  async handleUnsubscribe(customerId) {
    try {
      await Customer.findByIdAndUpdate(customerId, {
        "preferences.unsubscribed": true,
        "preferences.unsubscribedAt": new Date(),
      });

      // Publish unsubscribe event
      await redisService.publishEvent("customer-unsubscribed", {
        customerId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error handling unsubscribe:", error);
    }
  }
}

module.exports = new DeliveryReceiptController();
