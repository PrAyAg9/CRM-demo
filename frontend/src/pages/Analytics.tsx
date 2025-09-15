import React from "react";

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Analytics
          </h2>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <p className="text-gray-500">
            Analytics dashboard will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
