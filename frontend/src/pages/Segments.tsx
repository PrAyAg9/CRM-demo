import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import {
  UserGroupIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import RuleBuilder, { RuleGroup } from "../components/RuleBuilder";
import { NaturalLanguageSegmentBuilder } from "../components/AIFeatures";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Segments: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    {
      name: "AI Segment Builder",
      icon: SparklesIcon,
      component: <NaturalLanguageSegmentBuilder />,
    },
    {
      name: "Manual Builder",
      icon: AdjustmentsHorizontalIcon,
      component: <ManualSegmentBuilder />,
    },
    {
      name: "Existing Segments",
      icon: UserGroupIcon,
      component: <SegmentList />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Customer Segments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage customer segments using AI or manual rule builders
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                    "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                    selected
                      ? "bg-white text-blue-700 shadow"
                      : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
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

// Manual Segment Builder Component
const ManualSegmentBuilder: React.FC = () => {
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [rules, setRules] = useState<RuleGroup | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePreview = async (segmentRules: RuleGroup) => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: segmentRules }),
      });
      const data = await response.json();
      setCustomerCount(data.count);
    } catch (error) {
      console.error("Failed to preview segment:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    if (!segmentName.trim() || !rules) {
      alert("Please provide a segment name and create some rules");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDescription,
          rules,
          source: "manual",
        }),
      });

      if (!response.ok) throw new Error("Failed to create segment");

      alert("Segment created successfully!");

      // Reset form
      setSegmentName("");
      setSegmentDescription("");
      setRules(null);
      setCustomerCount(null);
    } catch (error) {
      console.error("Failed to save segment:", error);
      alert("Failed to create segment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Segment Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Segment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment Name *
            </label>
            <input
              type="text"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              className="form-input w-full"
              placeholder="e.g., High-Value Customers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={segmentDescription}
              onChange={(e) => setSegmentDescription(e.target.value)}
              className="form-input w-full"
              placeholder="Brief description of this segment"
            />
          </div>
        </div>
      </div>

      {/* Rule Builder */}
      <div className="bg-white p-6 rounded-lg shadow">
        <RuleBuilder
          onChange={setRules}
          onPreview={handlePreview}
          customerCount={customerCount || 0}
          isLoading={isPreviewLoading}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!segmentName.trim() || !rules || isSaving}
          className="btn-primary flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="spinner"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              <span>Create Segment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Segment List Component
const SegmentList: React.FC = () => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await fetch("/api/segments");
      const data = await response.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No segments found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first customer segment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Segments</h3>
      </div>
      <div className="p-6">
        <p className="text-gray-500">
          Segment list with detailed views and analytics will be implemented
          here.
        </p>
      </div>
    </div>
  );
};

export default Segments;
