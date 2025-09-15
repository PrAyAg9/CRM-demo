import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CampaignList, CampaignWizard } from "../components/CampaignManagement";

const Campaigns: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CampaignList />} />
      <Route path="/new" element={<CampaignWizard />} />
      <Route path="/:id" element={<CampaignDetails />} />
      <Route path="/:id/edit" element={<CampaignWizard />} />
      <Route path="/:id/analytics" element={<CampaignAnalytics />} />
      <Route path="*" element={<Navigate to="/campaigns" replace />} />
    </Routes>
  );
};

// Placeholder components for campaign details and analytics
const CampaignDetails: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Campaign Details</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">
          Campaign details view will be implemented here.
        </p>
      </div>
    </div>
  );
};

const CampaignAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Campaign Analytics</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">
          Campaign analytics view will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default Campaigns;
