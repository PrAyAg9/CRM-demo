const { Campaign, Segment, Customer, CommunicationLog } = require("../models");

class CampaignController {
  /**
   * Create a new campaign
   */
  async createCampaign(req, res) {
    try {
      const campaignData = {
        ...req.body,
        createdBy: req.user._id,
      };

      // Validate segment exists and belongs to user (if segmentId provided)
      if (campaignData.segmentId) {
        const segment = await Segment.findOne({
          _id: campaignData.segmentId,
          createdBy: req.user._id,
          isActive: true,
        });

        if (!segment) {
          return res.status(404).json({
            error: "Segment not found",
            message: "Segment does not exist or you do not have access to it",
          });
        }

        // Set audience size from segment
        campaignData.targeting = {
          ...campaignData.targeting,
          audienceSize: segment.audienceSize,
        };
        campaignData.stats = {
          ...campaignData.stats,
          audienceSize: segment.audienceSize,
        };
      }

      const campaign = new Campaign(campaignData);
      await campaign.save();

      // If campaign is scheduled to send immediately, trigger sending
      if (
        campaign.delivery.status === "scheduled" &&
        new Date(campaign.delivery.scheduledAt) <= new Date()
      ) {
        // For now, just mark as sent (we can implement actual sending later)
        campaign.delivery.status = "sent";
        campaign.delivery.sentAt = new Date();
        await campaign.save();
      }

      res.status(201).json({
        success: true,
        message: "Campaign created successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({
        error: "Failed to create campaign",
        message: error.message,
      });
    }
  }

  /**
   * Get all campaigns for the user
   */
  async getCampaigns(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = { createdBy: req.user._id, isActive: true };

      if (status) {
        query["delivery.status"] = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query with population
      const [campaigns, total] = await Promise.all([
        Campaign.find(query)
          .populate("segmentId", "name audienceSize")
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Campaign.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({
        error: "Failed to fetch campaigns",
        message: error.message,
      });
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user._id,
      }).populate("segmentId", "name description audienceSize ruleGroups");

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: "Campaign does not exist or you do not have access to it",
        });
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({
        error: "Failed to fetch campaign",
        message: error.message,
      });
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const updateData = req.body;

      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user._id,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: "Campaign does not exist or you do not have access to it",
        });
      }

      // Check if campaign can be edited
      if (!campaign.canBeEdited()) {
        return res.status(400).json({
          error: "Campaign cannot be edited",
          message: `Campaign in ${campaign.delivery.status} status cannot be modified`,
        });
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.createdBy;
      delete updateData._id;
      delete updateData.stats;

      Object.assign(campaign, updateData);
      await campaign.save();

      res.json({
        success: true,
        message: "Campaign updated successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({
        error: "Failed to update campaign",
        message: error.message,
      });
    }
  }

  /**
   * Delete (cancel) campaign
   */
  async deleteCampaign(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user._id,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: "Campaign does not exist or you do not have access to it",
        });
      }

      if (!campaign.canBeCancelled()) {
        return res.status(400).json({
          error: "Campaign cannot be cancelled",
          message: `Campaign in ${campaign.delivery.status} status cannot be cancelled`,
        });
      }

      campaign.delivery.status = "cancelled";
      campaign.isActive = false;
      await campaign.save();

      res.json({
        success: true,
        message: "Campaign cancelled successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({
        error: "Failed to cancel campaign",
        message: error.message,
      });
    }
  }

  /**
   * Send campaign immediately
   */
  async sendCampaign(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user._id,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: "Campaign does not exist or you do not have access to it",
        });
      }

      if (!["draft", "scheduled"].includes(campaign.delivery.status)) {
        return res.status(400).json({
          error: "Campaign cannot be sent",
          message: `Campaign in ${campaign.delivery.status} status cannot be sent`,
        });
      }

      // Update campaign status and trigger sending
      campaign.delivery.status = "sending";
      campaign.delivery.startedAt = new Date();
      await campaign.save();

      // Trigger async campaign sending
      await this.triggerCampaignSending(campaignId);

      res.json({
        success: true,
        message: "Campaign sending initiated",
        data: campaign,
      });
    } catch (error) {
      console.error("Send campaign error:", error);
      res.status(500).json({
        error: "Failed to send campaign",
        message: error.message,
      });
    }
  }

  /**
   * Get campaign delivery statistics
   */
  async getCampaignStats(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user._id,
      });

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: "Campaign does not exist or you do not have access to it",
        });
      }

      // Get detailed delivery statistics
      const deliveryStats = await CommunicationLog.getCampaignStats(campaignId);
      const engagementStats = await CommunicationLog.getEngagementStats(
        campaignId
      );

      // Get delivery timeline (last 24 hours)
      const timelineStart = new Date();
      timelineStart.setHours(timelineStart.getHours() - 24);

      const deliveryTimeline = await CommunicationLog.aggregate([
        {
          $match: {
            campaignId: mongoose.Types.ObjectId(campaignId),
            "delivery.attemptedAt": { $gte: timelineStart },
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: "$delivery.attemptedAt" },
              status: "$delivery.status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.hour": 1 } },
      ]);

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            status: campaign.delivery.status,
            stats: campaign.stats,
          },
          deliveryStats,
          engagementStats: engagementStats[0] || {},
          deliveryTimeline,
        },
      });
    } catch (error) {
      console.error("Get campaign stats error:", error);
      res.status(500).json({
        error: "Failed to fetch campaign statistics",
        message: error.message,
      });
    }
  }

  /**
   * Get campaign analytics for user
   */
  async getCampaignAnalytics(req, res) {
    try {
      const { period = 30 } = req.query;

      const analytics = await Campaign.getCampaignAnalytics(
        req.user._id,
        Number(period)
      );

      // Get campaign performance by status
      const statusDistribution = await Campaign.aggregate([
        { $match: { createdBy: req.user._id, isActive: true } },
        {
          $group: {
            _id: "$delivery.status",
            count: { $sum: 1 },
            totalSent: { $sum: "$stats.totalSent" },
            totalCost: { $sum: "$budget.totalCost" },
          },
        },
      ]);

      // Get top performing campaigns
      const topCampaigns = await Campaign.find({
        createdBy: req.user._id,
        "delivery.status": "sent",
        "stats.totalSent": { $gt: 0 },
      })
        .sort({ "stats.deliveryRate": -1, "stats.openRate": -1 })
        .limit(5)
        .select("name stats.deliveryRate stats.openRate stats.clickRate")
        .lean();

      res.json({
        success: true,
        data: {
          summary: analytics[0] || {},
          statusDistribution,
          topCampaigns,
        },
      });
    } catch (error) {
      console.error("Get campaign analytics error:", error);
      res.status(500).json({
        error: "Failed to fetch campaign analytics",
        message: error.message,
      });
    }
  }

  /**
   * Trigger campaign sending (async process)
   */
  async triggerCampaignSending(campaignId) {
    try {
      // Publish campaign sending event to Redis
      await redisService.publishCampaignEvent("campaign.send", {
        campaignId: campaignId.toString(),
        timestamp: new Date().toISOString(),
      });

      console.log(`Campaign sending triggered for campaign: ${campaignId}`);
    } catch (error) {
      console.error("Error triggering campaign sending:", error);
      throw error;
    }
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const { name } = req.body;

      const originalCampaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user._id,
      });

      if (!originalCampaign) {
        return res.status(404).json({
          error: "Campaign not found",
          message: "Campaign does not exist or you do not have access to it",
        });
      }

      // Create duplicate with reset stats
      const duplicateData = originalCampaign.toObject();
      delete duplicateData._id;
      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;

      duplicateData.name = name || `${originalCampaign.name} (Copy)`;
      duplicateData.delivery.status = "draft";
      duplicateData.delivery.startedAt = null;
      duplicateData.delivery.completedAt = null;
      duplicateData.stats = {
        audienceSize: duplicateData.stats.audienceSize,
        totalSent: 0,
        totalFailed: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        lastUpdated: new Date(),
      };

      const duplicateCampaign = new Campaign(duplicateData);
      await duplicateCampaign.save();

      res.status(201).json({
        success: true,
        message: "Campaign duplicated successfully",
        data: duplicateCampaign,
      });
    } catch (error) {
      console.error("Duplicate campaign error:", error);
      res.status(500).json({
        error: "Failed to duplicate campaign",
        message: error.message,
      });
    }
  }
}

module.exports = new CampaignController();
