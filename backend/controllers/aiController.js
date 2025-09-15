// This file is structured correctly. The error you are seeing is likely in
// your middleware files (e.g., auth.js, validation.js).
// Ensure they export a function directly, not an object.
// For example, a middleware file should end with:
// module.exports = function(req, res, next) { ... };
// NOT: module.exports = { myMiddleware };

const aiService = require('../services/aiService');
const { Customer, Campaign, CommunicationLog } = require('../models');

class AIController {
  /**
   * Convert natural language to segment rules
   */
  async convertToRules(req, res) {
    try {
      const { description } = req.body;

      if (!description || description.trim().length === 0) {
        return res.status(400).json({
          error: 'Description is required',
          message: 'Please provide a natural language description of the segment'
        });
      }

      const result = await aiService.convertNaturalLanguageToRules(description);

      if (!result.success) {
        return res.status(200).json({
          success: false,
          error: result.error,
          fallback: result.fallback,
          message: 'AI conversion failed, using fallback rules'
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Convert to rules error:', error);
      res.status(500).json({
        error: 'Failed to convert natural language to rules',
        message: error.message
      });
    }
  }

  /**
   * Test segment rules and get preview count
   */
  async previewSegment(req, res) {
    try {
      const { rules } = req.body;

      if (!rules || typeof rules !== 'object') {
        return res.status(400).json({
          error: 'Invalid rules',
          message: 'Please provide valid MongoDB query rules'
        });
      }

      const processedRules = this.processRulesForMongoDB(rules);

      const [count, sampleCustomers] = await Promise.all([
        Customer.countDocuments(processedRules),
        Customer.find(processedRules)
          .select('firstName lastName email totalSpent lastOrderDate')
          .limit(10)
          .sort({ totalSpent: -1 })
      ]);

      res.json({
        success: true,
        data: {
          count,
          sampleCustomers,
          rules: processedRules,
          preview: `This segment would include ${count} customers`
        }
      });
    } catch (error) {
      console.error('Preview segment error:', error);
      res.status(500).json({
        error: 'Failed to preview segment',
        message: error.message
      });
    }
  }

  /**
   * Generate message suggestions for a campaign
   */
  async generateMessages(req, res) {
    try {
      const { campaignType, audienceDescription, context = {} } = req.body;

      if (!campaignType || !audienceDescription) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'campaignType and audienceDescription are required'
        });
      }

      const result = await aiService.generateMessageSuggestions(
        campaignType, 
        audienceDescription, 
        context
      );

      if (!result.success) {
        return res.status(200).json({
          success: false,
          error: result.error,
          fallback: result.fallback,
          message: 'AI generation failed, using fallback messages'
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Generate messages error:', error);
      res.status(500).json({
        error: 'Failed to generate messages',
        message: error.message
      });
    }
  }

  /**
   * Analyze campaign performance with AI insights
   */
  async analyzeCampaign(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({
          error: 'Campaign not found',
          message: 'No campaign found with the provided ID'
        });
      }

      const communications = await CommunicationLog.find({ campaignId })
        .populate('customerId', 'totalSpent orderCount lastOrderDate');

      const performanceData = {
        campaignId,
        campaignName: campaign.name,
        campaignType: campaign.type,
        audience: campaign.audience,
        sent: communications.length,
        delivered: communications.filter(c => c.status === 'delivered').length,
        opened: communications.filter(c => c.openedAt).length,
        clicked: communications.filter(c => c.clickedAt).length,
        unsubscribed: communications.filter(c => c.unsubscribedAt).length,
        failed: communications.filter(c => ['failed', 'bounced'].includes(c.status)).length,
        avgCustomerValue: communications.reduce((sum, c) => sum + (c.customerId?.totalSpent || 0), 0) / communications.length,
        campaignDuration: campaign.updatedAt - campaign.createdAt,
        createdAt: campaign.createdAt,
        stats: campaign.stats
      };

      const benchmarks = {
        deliveryRate: 95,
        openRate: 20,
        clickRate: 3,
        unsubscribeRate: 0.5
      };

      const result = await aiService.analyzeCampaignPerformance(performanceData, benchmarks);

      if (!result.success) {
        return res.status(200).json({
          success: false,
          error: result.error,
          fallback: result.fallback,
          message: 'AI analysis failed, using fallback analysis'
        });
      }

      res.json({
        success: true,
        data: {
          ...result.data,
          performanceData,
          benchmarks
        }
      });
    } catch (error) {
      console.error('Analyze campaign error:', error);
      res.status(500).json({
        error: 'Failed to analyze campaign',
        message: error.message
      });
    }
  }

  /**
   * Generate customer insights
   */
  async getCustomerInsights(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          error: 'Customer not found',
          message: 'No customer found with the provided ID'
        });
      }

      const communications = await CommunicationLog.find({ customerId })
        .populate('campaignId', 'name type')
        .sort({ sentAt: -1 })
        .limit(20);

      const customerData = {
        customerId,
        profile: {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          totalSpent: customer.totalSpent,
          orderCount: customer.orderCount,
          avgOrderValue: customer.totalSpent / Math.max(customer.orderCount, 1),
          customerSince: customer.createdAt,
          lastOrderDate: customer.lastOrderDate,
          lastEngagementAt: customer.lastEngagementAt,
          status: customer.status,
          location: customer.location,
          preferences: customer.preferences
        },
        engagement: {
          totalCampaigns: communications.length,
          openedEmails: communications.filter(c => c.openedAt).length,
          clickedEmails: communications.filter(c => c.clickedAt).length,
          recentActivity: communications.slice(0, 5).map(c => ({
            campaign: c.campaignId?.name,
            type: c.campaignId?.type,
            status: c.status,
            sentAt: c.sentAt,
            openedAt: c.openedAt,
            clickedAt: c.clickedAt
          }))
        }
      };

      const result = await aiService.generateCustomerInsights(customerData);

      if (!result.success) {
        return res.status(200).json({
          success: false,
          error: result.error,
          message: 'AI insights generation failed'
        });
      }

      res.json({
        success: true,
        data: {
          ...result.data,
          customerData
        }
      });
    } catch (error) {
      console.error('Get customer insights error:', error);
      res.status(500).json({
        error: 'Failed to generate customer insights',
        message: error.message
      });
    }
  }

  /**
   * Get AI service status and capabilities
   */
  async getAIStatus(req, res) {
    try {
      const status = {
        available: aiService.isAvailable(),
        capabilities: {
          naturalLanguageToRules: true,
          messageGeneration: true,
          campaignAnalysis: true,
          customerInsights: true
        },
        features: [
          'Convert natural language to segment rules',
          'Generate personalized message suggestions',
          'Analyze campaign performance with AI insights',
          'Generate customer behavioral insights',
          'Predictive analytics for customer churn and CLV'
        ],
        limitations: aiService.isAvailable() ? [] : [
          'OpenAI API key not configured',
          'AI features will use fallback logic'
        ]
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get AI status error:', error);
      res.status(500).json({
        error: 'Failed to get AI status',
        message: error.message
      });
    }
  }

  /**
   * Process MongoDB rules to handle date strings and other conversions
   * @private
   */
  processRulesForMongoDB(rules) {
    const processedRules = JSON.parse(JSON.stringify(rules));
    
    const processValue = (value) => {
      if (typeof value === 'string') {
        if (value.includes('new Date(')) {
          try {
            const dateMatch = value.match(/new Date\(([^)]+)\)/);
            if (dateMatch) {
              const expression = dateMatch[1];
              if (expression.includes('Date.now()') || expression.match(/^\d+$/)) {
                return eval(value);
              }
            }
          } catch (e) {
            console.warn('Failed to process date string:', value);
          }
        }
        
        if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          return new Date(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const key in value) {
          value[key] = processValue(value[key]);
        }
      }
      
      return value;
    };

    return processValue(processedRules);
  }
}

module.exports = new AIController();