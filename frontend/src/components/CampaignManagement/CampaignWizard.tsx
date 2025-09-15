import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import RuleBuilder, { RuleGroup } from "../RuleBuilder";

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  type: "email" | "sms" | "push";
  category: "welcome" | "promotional" | "retention" | "re-engagement";
  subject?: string;
  content: string;
  thumbnail?: string;
}

interface SegmentPreview {
  count: number;
  sampleCustomers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "welcome-email",
    name: "Welcome Email",
    description: "Greet new customers and introduce your brand",
    type: "email",
    category: "welcome",
    subject: "Welcome to {{company_name}}!",
    content: `Hi {{first_name}},

Welcome to {{company_name}}! We're thrilled to have you as part of our community.

As a new member, you'll receive:
• Exclusive discounts and early access to sales
• Personalized product recommendations
• Expert tips and styling advice

Get started by exploring our latest collection: {{shop_url}}

Best regards,
The {{company_name}} Team`,
  },
  {
    id: "abandoned-cart",
    name: "Abandoned Cart Reminder",
    description: "Remind customers about items left in their cart",
    type: "email",
    category: "retention",
    subject: "You left something behind!",
    content: `Hi {{first_name}},

We noticed you left some great items in your cart. Don't let them get away!

{{cart_items}}

Complete your purchase now and get FREE shipping on orders over $50.

Shop now: {{cart_url}}

Happy shopping!`,
  },
  {
    id: "win-back",
    name: "Win-Back Campaign",
    description: "Re-engage inactive customers",
    type: "email",
    category: "re-engagement",
    subject: "We miss you! Come back for 20% off",
    content: `Hi {{first_name}},

We haven't seen you in a while and we miss you!

As a valued customer, we'd like to offer you 20% off your next purchase.

Use code: COMEBACK20

Shop now: {{shop_url}}

This offer expires in 7 days, so don't wait!`,
  },
  {
    id: "birthday-sms",
    name: "Birthday SMS",
    description: "Send birthday wishes with a special offer",
    type: "sms",
    category: "promotional",
    content: `🎉 Happy Birthday {{first_name}}! Celebrate with 15% off your next order. Use code: BIRTHDAY15. Valid for 48 hours: {{shop_url}}`,
  },
  {
    id: "flash-sale",
    name: "Flash Sale Alert",
    description: "Notify customers about limited-time offers",
    type: "push",
    category: "promotional",
    content: `⚡ FLASH SALE: 30% off everything! Limited time only. Shop now before it's gone!`,
  },
];

const CampaignWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaign, setCampaign] = useState({
    name: "",
    type: "email" as "email" | "sms" | "push",
    subject: "",
    content: "",
    audienceType: "segment" as "all" | "segment" | "upload",
    segmentRules: null as RuleGroup | null,
    schedulingType: "immediate" as "immediate" | "scheduled" | "recurring",
    scheduledDate: "",
    scheduledTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [selectedTemplate, setSelectedTemplate] =
    useState<CampaignTemplate | null>(null);
  const [segmentPreview, setSegmentPreview] = useState<SegmentPreview | null>(
    null
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const steps = [
    { id: 1, name: "Template", icon: DocumentTextIcon },
    { id: 2, name: "Content", icon: DocumentTextIcon },
    { id: 3, name: "Audience", icon: UserGroupIcon },
    { id: 4, name: "Schedule", icon: CalendarIcon },
    { id: 5, name: "Review", icon: SparklesIcon },
  ];

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaign((prev) => ({
      ...prev,
      type: template.type,
      subject: template.subject || "",
      content: template.content,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
    }));
    setCurrentStep(2);
  };

  const handleSegmentPreview = async (rules: RuleGroup) => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await response.json();
      setSegmentPreview(data);
    } catch (error) {
      console.error("Failed to preview segment:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    try {
      const campaignData = {
        ...campaign,
        template: selectedTemplate?.id,
      };

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        const createdCampaign = await response.json();
        navigate(`/campaigns/${createdCampaign._id}`);
      } else {
        throw new Error("Failed to create campaign");
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TemplateStep
            templates={CAMPAIGN_TEMPLATES}
            onSelect={handleTemplateSelect}
          />
        );
      case 2:
        return (
          <ContentStep
            campaign={campaign}
            onChange={setCampaign}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <AudienceStep
            campaign={campaign}
            onChange={setCampaign}
            onPreview={handleSegmentPreview}
            segmentPreview={segmentPreview}
            isLoadingPreview={isLoadingPreview}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <ScheduleStep
            campaign={campaign}
            onChange={setCampaign}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        );
      case 5:
        return (
          <ReviewStep
            campaign={campaign}
            template={selectedTemplate}
            segmentPreview={segmentPreview}
            onCreateCampaign={handleCreateCampaign}
            isCreating={isCreating}
            onBack={() => setCurrentStep(4)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
        <p className="mt-2 text-gray-600">
          Build and launch targeted marketing campaigns to engage your customers
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.name}
                className={`relative ${stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""}`}
              >
                <div className="flex items-center">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      step.id <= currentStep
                        ? "bg-indigo-600 text-white"
                        : "border-2 border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span
                    className={`ml-4 text-sm font-medium ${
                      step.id <= currentStep
                        ? "text-indigo-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 ${
                      step.id < currentStep ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow-lg rounded-lg">{renderStepContent()}</div>
    </div>
  );
};

interface TemplateStepProps {
  templates: CampaignTemplate[];
  onSelect: (template: CampaignTemplate) => void;
}

const TemplateStep: React.FC<TemplateStepProps> = ({ templates, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "welcome", label: "Welcome" },
    { value: "promotional", label: "Promotional" },
    { value: "retention", label: "Retention" },
    { value: "re-engagement", label: "Re-engagement" },
  ];

  const types = [
    { value: "all", label: "All Types" },
    { value: "email", label: "Email", icon: EnvelopeIcon },
    { value: "sms", label: "SMS", icon: PhoneIcon },
    { value: "push", label: "Push", icon: ChatBubbleLeftIcon },
  ];

  const filteredTemplates = templates.filter((template) => {
    const categoryMatch =
      selectedCategory === "all" || template.category === selectedCategory;
    const typeMatch = selectedType === "all" || template.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const getTypeIcon = (type: string) => {
    const typeConfig = types.find((t) => t.value === type);
    return typeConfig?.icon || EnvelopeIcon;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Choose a Template
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="form-input"
            >
              {types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const TypeIcon = getTypeIcon(template.type);
          return (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TypeIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {template.type}
                  </span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>
              <div className="text-xs text-gray-500">
                {template.subject && (
                  <p className="truncate">Subject: {template.subject}</p>
                )}
                <p className="truncate mt-1">
                  Content: {template.content.substring(0, 50)}...
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No templates found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to see more templates.
          </p>
        </div>
      )}
    </div>
  );
};

interface ContentStepProps {
  campaign: any;
  onChange: (campaign: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const ContentStep: React.FC<ContentStepProps> = ({
  campaign,
  onChange,
  onNext,
  onBack,
}) => {
  const handleChange = (field: string, value: string) => {
    onChange((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Campaign Content
        </h2>
        <p className="text-gray-600">
          Customize your campaign message and settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaign.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="form-input w-full"
            placeholder="Enter campaign name"
          />
        </div>

        {/* Campaign Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Type
          </label>
          <div className="flex space-x-4">
            {[
              { value: "email", label: "Email", icon: EnvelopeIcon },
              { value: "sms", label: "SMS", icon: PhoneIcon },
              { value: "push", label: "Push", icon: ChatBubbleLeftIcon },
            ].map((type) => {
              const Icon = type.icon;
              return (
                <label key={type.value} className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={campaign.type === type.value}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="form-radio"
                  />
                  <Icon className="ml-2 h-5 w-5 text-gray-500" />
                  <span className="ml-1 text-sm text-gray-700">
                    {type.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Subject Line (for email) */}
        {campaign.type === "email" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={campaign.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className="form-input w-full"
              placeholder="Enter email subject"
            />
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Content
          </label>
          <textarea
            value={campaign.content}
            onChange={(e) => handleChange("content", e.target.value)}
            rows={campaign.type === "sms" ? 4 : 8}
            className="form-input w-full"
            placeholder="Enter your message..."
          />
          <div className="mt-2 text-sm text-gray-500">
            {campaign.type === "sms" && (
              <p>Character count: {campaign.content.length}/160</p>
            )}
            <p className="mt-1">
              You can use variables like {"{{first_name}}"},{" "}
              {"{{company_name}}"}, {"{{shop_url}}"} in your content.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="text-sm text-gray-600">
            {campaign.type === "email" && campaign.subject && (
              <p className="font-medium mb-2">Subject: {campaign.subject}</p>
            )}
            <div className="whitespace-pre-wrap">{campaign.content}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!campaign.name || !campaign.content}
          className="btn-primary"
        >
          Next: Select Audience
        </button>
      </div>
    </div>
  );
};

interface AudienceStepProps {
  campaign: any;
  onChange: (campaign: any) => void;
  onPreview: (rules: RuleGroup) => void;
  segmentPreview: SegmentPreview | null;
  isLoadingPreview: boolean;
  onNext: () => void;
  onBack: () => void;
}

const AudienceStep: React.FC<AudienceStepProps> = ({
  campaign,
  onChange,
  onPreview,
  segmentPreview,
  isLoadingPreview,
  onNext,
  onBack,
}) => {
  const handleAudienceTypeChange = (type: string) => {
    onChange((prev: any) => ({
      ...prev,
      audienceType: type,
      segmentRules: null,
    }));
  };

  const handleSegmentRulesChange = (rules: RuleGroup) => {
    onChange((prev: any) => ({ ...prev, segmentRules: rules }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Select Audience
        </h2>
        <p className="text-gray-600">Choose who will receive this campaign.</p>
      </div>

      <div className="space-y-6">
        {/* Audience Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Audience Type
          </label>
          <div className="space-y-4">
            {[
              {
                value: "all",
                title: "All Customers",
                description: "Send to all customers in your database",
              },
              {
                value: "segment",
                title: "Customer Segment",
                description:
                  "Target specific customers based on rules and criteria",
              },
              {
                value: "upload",
                title: "Upload List",
                description: "Upload a CSV file with specific customer emails",
              },
            ].map((option) => (
              <label
                key={option.value}
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  campaign.audienceType === option.value
                    ? "border-indigo-600 ring-2 ring-indigo-600"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="audienceType"
                  value={option.value}
                  checked={campaign.audienceType === option.value}
                  onChange={(e) => handleAudienceTypeChange(e.target.value)}
                  className="sr-only"
                />
                <div className="flex">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {option.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Segment Builder */}
        {campaign.audienceType === "segment" && (
          <div>
            <RuleBuilder
              initialRules={campaign.segmentRules}
              onChange={handleSegmentRulesChange}
              onPreview={onPreview}
              customerCount={segmentPreview?.count}
              isLoading={isLoadingPreview}
            />
          </div>
        )}

        {/* File Upload */}
        {campaign.audienceType === "upload" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Customer List
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" accept=".csv" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
          </div>
        )}

        {/* Segment Preview */}
        {segmentPreview && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Audience Preview ({segmentPreview.count} customers)
            </h4>
            <div className="space-y-2">
              {segmentPreview.sampleCustomers.map((customer) => (
                <div key={customer.id} className="text-sm text-gray-600">
                  {customer.firstName} {customer.lastName} ({customer.email})
                </div>
              ))}
              {segmentPreview.count > segmentPreview.sampleCustomers.length && (
                <div className="text-sm text-gray-500">
                  +{" "}
                  {segmentPreview.count - segmentPreview.sampleCustomers.length}{" "}
                  more customers
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={
            campaign.audienceType === "segment" && !segmentPreview?.count
          }
          className="btn-primary"
        >
          Next: Schedule
        </button>
      </div>
    </div>
  );
};

interface ScheduleStepProps {
  campaign: any;
  onChange: (campaign: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({
  campaign,
  onChange,
  onNext,
  onBack,
}) => {
  const handleChange = (field: string, value: string) => {
    onChange((prev: any) => ({ ...prev, [field]: value }));
  };

  const now = new Date();
  const minDate = now.toISOString().split("T")[0];
  const minTime = now.toTimeString().slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Schedule Campaign
        </h2>
        <p className="text-gray-600">Choose when to send your campaign.</p>
      </div>

      <div className="space-y-6">
        {/* Scheduling Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            When to Send
          </label>
          <div className="space-y-4">
            {[
              {
                value: "immediate",
                title: "Send Immediately",
                description: "Campaign will be sent right after creation",
                icon: SparklesIcon,
              },
              {
                value: "scheduled",
                title: "Schedule for Later",
                description: "Choose a specific date and time",
                icon: CalendarIcon,
              },
              {
                value: "recurring",
                title: "Recurring Campaign",
                description: "Set up a repeating schedule",
                icon: ClockIcon,
              },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    campaign.schedulingType === option.value
                      ? "border-indigo-600 ring-2 ring-indigo-600"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="schedulingType"
                    value={option.value}
                    checked={campaign.schedulingType === option.value}
                    onChange={(e) =>
                      handleChange("schedulingType", e.target.value)
                    }
                    className="sr-only"
                  />
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {option.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Scheduled Date/Time */}
        {campaign.schedulingType === "scheduled" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={campaign.scheduledDate}
                onChange={(e) => handleChange("scheduledDate", e.target.value)}
                min={minDate}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={campaign.scheduledTime}
                onChange={(e) => handleChange("scheduledTime", e.target.value)}
                min={campaign.scheduledDate === minDate ? minTime : undefined}
                className="form-input w-full"
              />
            </div>
          </div>
        )}

        {/* Timezone */}
        {campaign.schedulingType !== "immediate" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={campaign.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
              className="form-input w-full"
            >
              {/* Common timezones - Intl.supportedValuesOf not available in all TypeScript versions */}
              {[
                "UTC",
                "America/New_York",
                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "Europe/London",
                "Europe/Paris",
                "Europe/Berlin",
                "Asia/Tokyo",
                "Asia/Shanghai",
                "Australia/Sydney",
              ].map((tz: string) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Recurring Options */}
        {campaign.schedulingType === "recurring" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Recurring campaigns are a premium feature. Contact support to
              enable this functionality.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={
            campaign.schedulingType === "scheduled" &&
            (!campaign.scheduledDate || !campaign.scheduledTime)
          }
          className="btn-primary"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
};

interface ReviewStepProps {
  campaign: any;
  template: CampaignTemplate | null;
  segmentPreview: SegmentPreview | null;
  onCreateCampaign: () => void;
  isCreating: boolean;
  onBack: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  campaign,
  template,
  segmentPreview,
  onCreateCampaign,
  isCreating,
  onBack,
}) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Review Campaign
        </h2>
        <p className="text-gray-600">
          Review your campaign details before sending.
        </p>
      </div>

      <div className="space-y-6">
        {/* Campaign Overview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Campaign Overview
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{campaign.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="text-sm text-gray-900 capitalize">
                {campaign.type}
              </dd>
            </div>
            {template && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Template</dt>
                <dd className="text-sm text-gray-900">{template.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Audience</dt>
              <dd className="text-sm text-gray-900">
                {campaign.audienceType === "all" && "All Customers"}
                {campaign.audienceType === "segment" &&
                  `Customer Segment (${segmentPreview?.count || 0} customers)`}
                {campaign.audienceType === "upload" && "Uploaded List"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Content Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Content Preview
          </h3>
          {campaign.type === "email" && campaign.subject && (
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-500">
                Subject:{" "}
              </span>
              <span className="text-sm text-gray-900">{campaign.subject}</span>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded p-3">
            <div className="text-sm text-gray-900 whitespace-pre-wrap">
              {campaign.content}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
          <div className="text-sm text-gray-900">
            {campaign.schedulingType === "immediate" &&
              "Send immediately after creation"}
            {campaign.schedulingType === "scheduled" &&
              `Scheduled for ${campaign.scheduledDate} at ${campaign.scheduledTime} (${campaign.timezone})`}
            {campaign.schedulingType === "recurring" &&
              "Recurring campaign (premium feature)"}
          </div>
        </div>

        {/* Confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <SparklesIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Ready to Launch
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your campaign is ready to be created.
                  {campaign.schedulingType === "immediate" &&
                    " It will be sent immediately to your selected audience."}
                  {campaign.schedulingType === "scheduled" &&
                    " It will be sent at the scheduled time."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onCreateCampaign}
          disabled={isCreating}
          className="btn-primary flex items-center space-x-2"
        >
          {isCreating ? (
            <>
              <div className="spinner"></div>
              <span>Creating Campaign...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Create Campaign</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CampaignWizard;
