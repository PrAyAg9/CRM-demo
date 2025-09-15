import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import {
  NaturalLanguageSegmentBuilder,
  AIMessageSuggestions,
  AIInsightsDashboard,
} from "../components/AIFeatures";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const AIFeatures: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    {
      name: "Smart Segments",
      icon: SparklesIcon,
      description: "Create customer segments using natural language",
      component: <NaturalLanguageSegmentBuilder />,
    },
    {
      name: "Message Assistant",
      icon: ChatBubbleLeftRightIcon,
      description: "Get AI-powered content suggestions for campaigns",
      component: <AIMessageSuggestions />,
    },
    {
      name: "Insights Dashboard",
      icon: ChartBarIcon,
      description: "Discover AI-generated insights about your customers",
      component: <AIInsightsDashboard />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <span>AI-Powered Features</span>
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Leverage artificial intelligence to optimize your marketing
            campaigns and understand your customers better
          </p>
        </div>
      </div>

      {/* AI Features Overview */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <LightBulbIcon className="h-8 w-8" />
          <h3 className="text-xl font-semibold">What AI Can Do For You</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">Smart Customer Segmentation</h4>
            <p className="text-sm opacity-90">
              Describe your target audience in plain English and let AI create
              the perfect segment rules
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">Content Generation</h4>
            <p className="text-sm opacity-90">
              Get personalized message suggestions based on your campaign goals
              and audience
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-medium mb-2">Behavioral Insights</h4>
            <p className="text-sm opacity-90">
              Discover hidden patterns in customer behavior and receive
              actionable recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-3 px-4 text-sm font-medium leading-5",
                    "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                    selected
                      ? "bg-white text-indigo-700 shadow"
                      : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
                  )
                }
              >
                <div className="flex flex-col items-center space-y-2">
                  <tab.icon className="h-6 w-6" />
                  <div>
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </div>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-8">
            {tabs.map((tab, index) => (
              <Tab.Panel key={index} className="focus:outline-none">
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AIFeatures;
