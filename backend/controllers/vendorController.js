const { CommunicationLog, Campaign, Customer } = require("../models");
const axios = require("axios");

class VendorController {
  /**
   * Simulate message delivery via vendor API
   * This simulates real-world vendor APIs like SendGrid, Twilio, etc.
   */
  async simulateDelivery(req, res) {
    try {
      const {
        recipient,
        message,
        channel = "email",
        campaignId,
        customerId,
      } = req.body;

      // Simulate processing time
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 500)
      );

      // Simulate success/failure rates (90% success, 10% failure)
      const isSuccess = Math.random() > 0.1;
      const vendorMessageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const response = {
        vendorMessageId,
        status: isSuccess ? "sent" : "failed",
        recipient,
        channel,
        timestamp: new Date().toISOString(),
      };

      if (!isSuccess) {
        const errorMessages = [
          "Invalid recipient address",
          "Recipient unsubscribed",
          "Rate limit exceeded",
          "Bounce - mailbox full",
          "Network timeout",
          "Authentication failed",
        ];
        response.error =
          errorMessages[Math.floor(Math.random() * errorMessages.length)];
        response.errorCode = `ERR_${Math.floor(Math.random() * 1000)}`;
      }

      // Simulate webhook call to delivery receipt endpoint
      if (campaignId && customerId) {
        setTimeout(async () => {
          try {
            await axios.post(
              `${
                process.env.VENDOR_API_BASE_URL || "http://localhost:3000"
              }/api/delivery-receipt`,
              {
                vendorMessageId,
                status: response.status,
                campaignId,
                customerId,
                deliveredAt: isSuccess ? new Date().toISOString() : null,
                errorMessage: response.error || null,
                statusCode: response.errorCode || null,
              }
            );
          } catch (error) {
            console.error("Error calling delivery receipt webhook:", error);
          }
        }, 200 + Math.random() * 1000); // Simulate webhook delay
      }

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Vendor delivery simulation error:", error);
      res.status(500).json({
        error: "Vendor delivery failed",
        message: error.message,
      });
    }
  }

  /**
   * Send bulk messages (batch processing)
   */
  async sendBulkMessages(req, res) {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "Invalid request",
          message: "messages array is required and cannot be empty",
        });
      }

      if (messages.length > 1000) {
        return res.status(400).json({
          error: "Batch too large",
          message: "Maximum 1000 messages per batch",
        });
      }

      const results = [];

      // Process messages in batches of 50
      const batchSize = 50;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchPromises = batch.map(async (message) => {
          // Simulate processing delay
          await new Promise((resolve) =>
            setTimeout(resolve, 50 + Math.random() * 200)
          );

          const isSuccess = Math.random() > 0.1;
          const vendorMessageId = `msg_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const result = {
            vendorMessageId,
            recipient: message.recipient,
            status: isSuccess ? "sent" : "failed",
            timestamp: new Date().toISOString(),
          };

          if (!isSuccess) {
            result.error = "Delivery failed";
            result.errorCode = `ERR_${Math.floor(Math.random() * 1000)}`;
          }

          // Trigger delivery receipt webhook
          if (message.campaignId && message.customerId) {
            setTimeout(async () => {
              try {
                await axios.post(
                  `${
                    process.env.VENDOR_API_BASE_URL || "http://localhost:3000"
                  }/api/delivery-receipt`,
                  {
                    vendorMessageId,
                    status: result.status,
                    campaignId: message.campaignId,
                    customerId: message.customerId,
                    deliveredAt: isSuccess ? new Date().toISOString() : null,
                    errorMessage: result.error || null,
                    statusCode: result.errorCode || null,
                  }
                );
              } catch (error) {
                console.error("Error calling delivery receipt webhook:", error);
              }
            }, 100 + Math.random() * 500);
          }

          return result;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to simulate rate limiting
        if (i + batchSize < messages.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const summary = {
        total: results.length,
        sent: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
      };

      res.json({
        success: true,
        message: `Processed ${results.length} messages`,
        data: {
          summary,
          results: results.slice(0, 10), // Return first 10 for reference
        },
      });
    } catch (error) {
      console.error("Bulk message sending error:", error);
      res.status(500).json({
        error: "Failed to send bulk messages",
        message: error.message,
      });
    }
  }

  /**
   * Get vendor API status and configuration
   */
  async getVendorStatus(req, res) {
    try {
      const status = {
        service: "Mini CRM Vendor Simulator",
        version: "1.0.0",
        status: "operational",
        uptime: process.uptime(),
        capabilities: {
          email: true,
          sms: true,
          batchProcessing: true,
          webhooks: true,
          maxBatchSize: 1000,
        },
        rates: {
          email: 0.05, // INR per email
          sms: 0.1, // INR per SMS
        },
        limits: {
          rateLimit: "1000/minute",
          dailyLimit: 100000,
          monthlyLimit: 1000000,
        },
        successRate: "90%",
        averageDeliveryTime: "2-5 seconds",
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Get vendor status error:", error);
      res.status(500).json({
        error: "Failed to get vendor status",
        message: error.message,
      });
    }
  }

  /**
   * Validate recipient addresses
   */
  async validateRecipients(req, res) {
    try {
      const { recipients, channel = "email" } = req.body;

      if (!Array.isArray(recipients)) {
        return res.status(400).json({
          error: "Invalid request",
          message: "recipients array is required",
        });
      }

      const validationResults = recipients.map((recipient) => {
        let isValid = false;
        let reason = "";

        if (channel === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          isValid = emailRegex.test(recipient);
          reason = isValid ? "Valid email format" : "Invalid email format";

          // Simulate some invalid domains
          if (isValid && recipient.includes("invalid-domain.com")) {
            isValid = false;
            reason = "Domain does not exist";
          }
        } else if (channel === "sms") {
          const phoneRegex = /^\+?[1-9]\d{9,14}$/;
          isValid = phoneRegex.test(recipient.replace(/\s/g, ""));
          reason = isValid ? "Valid phone format" : "Invalid phone format";
        }

        // Simulate 5% invalid rate for demonstration
        if (isValid && Math.random() < 0.05) {
          isValid = false;
          reason = "Recipient opted out";
        }

        return {
          recipient,
          isValid,
          reason,
        };
      });

      const summary = {
        total: validationResults.length,
        valid: validationResults.filter((r) => r.isValid).length,
        invalid: validationResults.filter((r) => !r.isValid).length,
      };

      res.json({
        success: true,
        data: {
          summary,
          results: validationResults,
        },
      });
    } catch (error) {
      console.error("Validate recipients error:", error);
      res.status(500).json({
        error: "Failed to validate recipients",
        message: error.message,
      });
    }
  }

  /**
   * Get delivery analytics
   */
  async getDeliveryAnalytics(req, res) {
    try {
      const { period = 7 } = req.query; // days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(period));

      // Simulate vendor analytics
      const analytics = {
        period: `${period} days`,
        totalMessages: Math.floor(Math.random() * 10000) + 5000,
        delivered: Math.floor(Math.random() * 8500) + 4500,
        failed: Math.floor(Math.random() * 500) + 100,
        bounced: Math.floor(Math.random() * 200) + 50,
        deliveryRate: 90 + Math.random() * 8, // 90-98%
        averageDeliveryTime: 2.5 + Math.random() * 2, // 2.5-4.5 seconds
        topFailureReasons: [
          {
            reason: "Invalid email address",
            count: Math.floor(Math.random() * 100) + 50,
          },
          {
            reason: "Mailbox full",
            count: Math.floor(Math.random() * 80) + 30,
          },
          {
            reason: "Rate limit exceeded",
            count: Math.floor(Math.random() * 60) + 20,
          },
          {
            reason: "Temporary failure",
            count: Math.floor(Math.random() * 40) + 10,
          },
        ],
        dailyVolume: [],
      };

      // Generate daily volume data
      for (let i = Number(period) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        analytics.dailyVolume.push({
          date: date.toISOString().split("T")[0],
          sent: Math.floor(Math.random() * 1000) + 200,
          delivered: Math.floor(Math.random() * 900) + 180,
          failed: Math.floor(Math.random() * 50) + 10,
        });
      }

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Get delivery analytics error:", error);
      res.status(500).json({
        error: "Failed to get delivery analytics",
        message: error.message,
      });
    }
  }
}

module.exports = new VendorController();
