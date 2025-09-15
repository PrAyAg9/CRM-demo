import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ChartBarIcon,
  MicrophoneIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import RuleBuilder, { RuleGroup } from "../RuleBuilder";

interface AISegmentSuggestion {
  id: string;
  name: string;
  description: string;
  rules: RuleGroup;
  confidence: number;
  potentialAudience: number;
  insights: string[];
}

interface AIMessageSuggestion {
  id: string;
  type: "email" | "sms" | "push";
  subject?: string;
  content: string;
  tone: "professional" | "friendly" | "urgent" | "promotional";
  confidence: number;
  reasoning: string;
}

interface AIInsight {
  id: string;
  type:
    | "customer_behavior"
    | "segment_performance"
    | "campaign_optimization"
    | "trend_analysis";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  recommendation: string;
  data?: any;
}

const NaturalLanguageSegmentBuilder: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AISegmentSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AISegmentSuggestion | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Voice recognition setup
  const [recognition, setRecognition] = useState<any | null>(null);

  useEffect(() => {
    if (
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleQuerySubmit(transcript);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleVoiceInput = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const handleQuerySubmit = async (inputQuery?: string) => {
    const searchQuery = inputQuery || query;
    if (!searchQuery.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/segment-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) throw new Error("Failed to get AI suggestions");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to get AI segment suggestions:", error);
      alert("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AISegmentSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleCreateSegment = async (suggestion: AISegmentSuggestion) => {
    try {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.name,
          description: suggestion.description,
          rules: suggestion.rules,
          source: "ai_generated",
        }),
      });

      if (!response.ok) throw new Error("Failed to create segment");

      const createdSegment = await response.json();
      alert(`Segment "${suggestion.name}" created successfully!`);

      // Reset state
      setQuery("");
      setSuggestions([]);
      setSelectedSuggestion(null);
    } catch (error) {
      console.error("Failed to create segment:", error);
      alert("Failed to create segment. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Natural Language Segment Builder
          </h2>
        </div>

        <p className="text-gray-600 mb-6">
          Describe your target audience in plain English, and AI will create the
          segment rules for you.
        </p>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'Find customers who spent more than $500 in the last 3 months and haven't placed an order in the last 30 days'"
                className="form-input w-full h-20 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuerySubmit();
                  }
                }}
              />
            </div>
            {recognition && (
              <button
                onClick={handleVoiceInput}
                disabled={isListening}
                className={`p-3 rounded-lg border ${
                  isListening
                    ? "bg-red-100 border-red-300 text-red-600"
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
                title="Voice input"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Try: "High-value customers from New York" or "Inactive users with
              email subscriptions"
            </div>
            <button
              onClick={() => handleQuerySubmit()}
              disabled={isProcessing || !query.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Generate Segments</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Voice Recognition Status */}
        {isListening && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse">
                <MicrophoneIcon className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm text-red-800">
                Listening... Speak now
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Segment Suggestions
          </h3>

          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSuggestion?.id === suggestion.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {suggestion.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>
                        {suggestion.potentialAudience.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="h-4 w-4" />
                      <span>{Math.round(suggestion.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {suggestion.insights.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      AI Insights:
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {suggestion.insights.map((insight, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <LightBulbIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateSegment(suggestion);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Create Segment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Suggestion Details */}
      {selectedSuggestion && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Segment Rules Preview
          </h3>
          <RuleBuilder
            initialRules={selectedSuggestion.rules}
            onChange={() => {}} // Read-only preview
            customerCount={selectedSuggestion.potentialAudience}
          />
        </div>
      )}
    </div>
  );
};

const AIMessageSuggestions: React.FC = () => {
  const [campaignType, setCampaignType] = useState<"email" | "sms" | "push">(
    "email"
  );
  const [campaignGoal, setCampaignGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<
    "professional" | "friendly" | "urgent" | "promotional"
  >("friendly");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AIMessageSuggestion[]>([]);

  const handleGenerateSuggestions = async () => {
    if (!campaignGoal.trim() || !targetAudience.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/message-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: campaignType,
          goal: campaignGoal,
          audience: targetAudience,
          tone,
        }),
      });

      if (!response.ok)
        throw new Error("Failed to generate message suggestions");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to generate message suggestions:", error);
      alert("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-3 mb-4">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            AI Message Suggestions
          </h2>
        </div>

        <p className="text-gray-600 mb-6">
          Get AI-powered content suggestions for your campaigns based on your
          goals and audience.
        </p>

        {/* Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Type
            </label>
            <select
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value as any)}
              className="form-input w-full"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="form-input w-full"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
              <option value="promotional">Promotional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Goal *
            </label>
            <input
              type="text"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              placeholder="e.g., Promote summer sale, Welcome new customers, Re-engage inactive users"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., High-value customers, New subscribers, Inactive users"
              className="form-input w-full"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateSuggestions}
          disabled={isGenerating}
          className="btn-primary flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="spinner"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generate Suggestions</span>
            </>
          )}
        </button>
      </div>

      {/* Message Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Generated Message Suggestions
          </h3>

          <div className="space-y-6">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {suggestion.type} - {suggestion.tone}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Subject Line (for email) */}
                {suggestion.subject && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Line:
                    </label>
                    <div className="bg-gray-50 p-3 rounded border flex justify-between items-center">
                      <span className="text-sm text-gray-900">
                        {suggestion.subject}
                      </span>
                      <button
                        onClick={() => copyToClipboard(suggestion.subject!)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content:
                  </label>
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {suggestion.content}
                      </div>
                      <button
                        onClick={() => copyToClipboard(suggestion.content)}
                        className="ml-3 text-indigo-600 hover:text-indigo-800 text-sm flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <h5 className="text-sm font-medium text-blue-800 mb-1">
                    AI Reasoning:
                  </h5>
                  <p className="text-sm text-blue-700">
                    {suggestion.reasoning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AIInsightsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ai/insights");

      if (!response.ok) throw new Error("Failed to fetch insights");

      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "customer_behavior":
        return UserGroupIcon;
      case "segment_performance":
        return ChartBarIcon;
      case "campaign_optimization":
        return EnvelopeIcon;
      case "trend_analysis":
        return ClockIcon;
      default:
        return LightBulbIcon;
    }
  };

  const filteredInsights = insights.filter((insight) => {
    if (filter === "all") return true;
    return insight.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              AI Insights Dashboard
            </h2>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Insights</option>
            <option value="customer_behavior">Customer Behavior</option>
            <option value="segment_performance">Segment Performance</option>
            <option value="campaign_optimization">Campaign Optimization</option>
            <option value="trend_analysis">Trend Analysis</option>
          </select>
        </div>

        <p className="text-gray-600">
          AI-powered insights to help you optimize your marketing strategy and
          improve customer engagement.
        </p>
      </div>

      {/* Insights Grid */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No insights available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Check back later as AI analyzes your data for new insights.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInsights.map((insight) => {
            const TypeIcon = getTypeIcon(insight.type);

            return (
              <div key={insight.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TypeIcon className="h-6 w-6 text-indigo-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {insight.title}
                      </h3>
                      <span className="text-sm text-gray-500 capitalize">
                        {insight.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(
                      insight.impact
                    )}`}
                  >
                    {insight.impact} impact
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{insight.description}</p>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="text-sm font-medium text-indigo-800 mb-2">
                    AI Recommendation:
                  </h4>
                  <p className="text-sm text-indigo-700">
                    {insight.recommendation}
                  </p>
                </div>

                {/* Additional Data Visualization */}
                {insight.data && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Based on analysis of recent customer data and campaign
                      performance.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Export all components
export {
  NaturalLanguageSegmentBuilder,
  AIMessageSuggestions,
  AIInsightsDashboard,
};
