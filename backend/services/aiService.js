const OpenAI = require("openai");

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found. AI features will be disabled.");
      this.openai = null;
      return;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Check if AI service is available
   */
  isAvailable() {
    return this.openai !== null;
  }

  /**
   * Convert natural language to segment rules
   * Example: "customers who spent more than 1000 in the last 30 days"
   */
  async convertNaturalLanguageToRules(naturalLanguage) {
    if (!this.isAvailable()) {
      throw new Error(
        "AI service is not available. Please configure OpenAI API key."
      );
    }

    try {
      const prompt = `
Convert the following natural language description into a MongoDB-style query object for customer segmentation.

Available customer fields:
- firstName, lastName, email, phone
- totalSpent (number)
- lastOrderDate (Date)
- orderCount (number)
- createdAt (Date)
- status (active, inactive, banned)
- location.city, location.state, location.country
- preferences.channel (email, sms, both)
- preferences.frequency (daily, weekly, monthly)
- lastEngagementAt (Date)

Available order fields (for aggregation):
- customerId, amount, status, createdAt
- products.name, products.category, products.price

Natural language: "${naturalLanguage}"

Return only a valid JSON object with MongoDB query syntax. Include both the query object and a human-readable description.

Example format:
{
  "query": {
    "totalSpent": { "$gte": 1000 },
    "lastOrderDate": { "$gte": new Date(Date.now() - 30*24*60*60*1000) }
  },
  "description": "Customers who have spent at least 1000 and made an order in the last 30 days",
  "estimatedCount": "Use this field to explain how many customers might match"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at converting natural language to MongoDB queries for customer segmentation. Always return valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content.trim();

      // Try to parse the JSON response
      let result;
      try {
        // Remove any markdown formatting
        const jsonContent = content.replace(/```json\n?|\n?```/g, "");
        result = JSON.parse(jsonContent);
      } catch (parseError) {
        // If parsing fails, try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }

      // Validate the response structure
      if (!result.query || !result.description) {
        throw new Error("AI response missing required fields");
      }

      return {
        success: true,
        data: {
          originalText: naturalLanguage,
          mongoQuery: result.query,
          description: result.description,
          estimatedImpact: result.estimatedCount || "Unknown",
          confidence: "high", // Could be enhanced with confidence scoring
        },
      };
    } catch (error) {
      console.error("Natural language to rules conversion error:", error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackRules(naturalLanguage),
      };
    }
  }

  /**
   * Generate AI-powered message suggestions for campaigns
   */
  async generateMessageSuggestions(campaignType, audience, context = {}) {
    if (!this.isAvailable()) {
      throw new Error(
        "AI service is not available. Please configure OpenAI API key."
      );
    }

    try {
      const prompt = `
Generate 3 personalized message suggestions for a ${campaignType} campaign.

Target Audience: ${audience}
Campaign Context: ${JSON.stringify(context, null, 2)}

Requirements:
- Messages should be engaging and relevant to the audience
- Include personalization placeholders like {{firstName}}, {{lastName}}
- Vary the tone and approach for each suggestion
- Keep messages concise and actionable
- Include clear call-to-action
- Consider the campaign type (promotional, transactional, nurture, etc.)

Return JSON format:
{
  "suggestions": [
    {
      "title": "Suggestion title",
      "message": "Message content with {{placeholders}}",
      "tone": "professional|friendly|urgent|casual",
      "cta": "Call to action text",
      "rationale": "Why this message works for this audience"
    }
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert marketing copywriter specializing in personalized campaign messages. Always return valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content.trim();
      const jsonContent = content.replace(/```json\n?|\n?```/g, "");
      const result = JSON.parse(jsonContent);

      return {
        success: true,
        data: {
          campaignType,
          audience,
          suggestions: result.suggestions || [],
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Message generation error:", error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackMessages(campaignType),
      };
    }
  }

  /**
   * Analyze campaign performance and provide AI insights
   */
  async analyzeCampaignPerformance(campaignData, benchmarks = {}) {
    if (!this.isAvailable()) {
      throw new Error(
        "AI service is not available. Please configure OpenAI API key."
      );
    }

    try {
      const prompt = `
Analyze the following campaign performance data and provide actionable insights:

Campaign Data:
${JSON.stringify(campaignData, null, 2)}

Industry Benchmarks:
${JSON.stringify(benchmarks, null, 2)}

Provide analysis in the following JSON format:
{
  "summary": "Overall performance summary",
  "strengths": ["What worked well"],
  "weaknesses": ["Areas for improvement"],
  "recommendations": [
    {
      "category": "targeting|content|timing|channel",
      "suggestion": "Specific actionable recommendation",
      "expectedImpact": "potential improvement description",
      "priority": "high|medium|low"
    }
  ],
  "nextSteps": ["Immediate actions to take"],
  "score": 85 // Overall campaign score out of 100
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert marketing analyst providing data-driven insights for campaign optimization. Always return valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content.trim();
      const jsonContent = content.replace(/```json\n?|\n?```/g, "");
      const result = JSON.parse(jsonContent);

      return {
        success: true,
        data: {
          ...result,
          analyzedAt: new Date().toISOString(),
          campaignId: campaignData.campaignId,
        },
      };
    } catch (error) {
      console.error("Campaign analysis error:", error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackAnalysis(campaignData),
      };
    }
  }

  /**
   * Generate customer insights based on behavior data
   */
  async generateCustomerInsights(customerData) {
    if (!this.isAvailable()) {
      throw new Error(
        "AI service is not available. Please configure OpenAI API key."
      );
    }

    try {
      const prompt = `
Analyze the following customer data and provide behavioral insights:

Customer Data:
${JSON.stringify(customerData, null, 2)}

Provide insights in JSON format:
{
  "profile": "Customer behavior profile summary",
  "segments": ["Suggested customer segments"],
  "preferences": {
    "channels": ["preferred communication channels"],
    "timing": "best engagement times",
    "content": "content preferences"
  },
  "predictions": {
    "churnRisk": "low|medium|high",
    "lifetimeValue": "estimated CLV category",
    "nextAction": "predicted next customer action"
  },
  "recommendations": [
    "Specific engagement recommendations"
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a customer behavior analyst providing insights for personalized marketing. Always return valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content.trim();
      const jsonContent = content.replace(/```json\n?|\n?```/g, "");
      const result = JSON.parse(jsonContent);

      return {
        success: true,
        data: {
          ...result,
          customerId: customerData.customerId,
          analyzedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Customer insights error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fallback rules when AI is not available
   * @private
   */
  getFallbackRules(naturalLanguage) {
    const fallbackRules = {
      "high value": { totalSpent: { $gte: 1000 } },
      "recent customers": {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      active: { status: "active" },
      "email subscribers": {
        "preferences.channel": { $in: ["email", "both"] },
      },
    };

    const lowerText = naturalLanguage.toLowerCase();
    for (const [key, rule] of Object.entries(fallbackRules)) {
      if (lowerText.includes(key)) {
        return {
          query: rule,
          description: `Fallback rule for: ${key}`,
          confidence: "low",
        };
      }
    }

    return {
      query: { status: "active" },
      description: "Default fallback: active customers",
      confidence: "low",
    };
  }

  /**
   * Fallback messages when AI is not available
   * @private
   */
  getFallbackMessages(campaignType) {
    const fallbackMessages = {
      promotional: [
        {
          title: "Limited Time Offer",
          message:
            "Hi {{firstName}}, don't miss out on our special offer just for you!",
          tone: "friendly",
          cta: "Shop Now",
        },
      ],
      transactional: [
        {
          title: "Order Confirmation",
          message:
            "Hi {{firstName}}, thank you for your order. We'll keep you updated.",
          tone: "professional",
          cta: "Track Order",
        },
      ],
      nurture: [
        {
          title: "We Value You",
          message: "Hi {{firstName}}, thank you for being a valued customer.",
          tone: "friendly",
          cta: "Learn More",
        },
      ],
    };

    return fallbackMessages[campaignType] || fallbackMessages.nurture;
  }

  /**
   * Fallback analysis when AI is not available
   * @private
   */
  getFallbackAnalysis(campaignData) {
    const deliveryRate =
      (campaignData.delivered / campaignData.sent) * 100 || 0;
    const openRate = (campaignData.opened / campaignData.delivered) * 100 || 0;

    return {
      summary: `Campaign sent to ${
        campaignData.sent
      } recipients with ${deliveryRate.toFixed(1)}% delivery rate`,
      strengths: deliveryRate > 95 ? ["High delivery rate"] : [],
      weaknesses: deliveryRate < 90 ? ["Low delivery rate"] : [],
      recommendations: [
        {
          category: "targeting",
          suggestion: "Review audience targeting",
          priority: "medium",
        },
      ],
      score: Math.min(Math.max(deliveryRate + openRate, 0), 100),
    };
  }
}

module.exports = new AIService();
