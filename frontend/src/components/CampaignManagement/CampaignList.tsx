import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Mail,
  Phone,
  MessageCircle,
  Eye,
  Pencil,
  Trash2,
  BarChart3,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
  type: "email" | "sms" | "push";
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "failed";
  subject?: string;
  audienceCount: number;
  audienceType: "all" | "segment" | "upload";
  schedulingType: "immediate" | "scheduled" | "recurring";
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

const CampaignList: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  useEffect(() => {
    fetchCampaigns();
  }, [filter, sortBy]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockCampaigns: Campaign[] = [
        {
          _id: "1",
          name: "Welcome Series",
          type: "email",
          status: "sent",
          subject: "Welcome to our community!",
          audienceCount: 1250,
          audienceType: "all",
          schedulingType: "immediate",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          metrics: {
            sent: 1250,
            delivered: 1200,
            opened: 480,
            clicked: 120,
            bounced: 25,
            unsubscribed: 5,
          },
        },
        {
          _id: "2",
          name: "Product Launch",
          type: "email",
          status: "scheduled",
          subject: "Exciting new product launch!",
          audienceCount: 850,
          audienceType: "segment",
          schedulingType: "scheduled",
          scheduledDate: "2024-02-01T09:00:00Z",
          createdAt: "2024-01-20T14:30:00Z",
          updatedAt: "2024-01-20T14:30:00Z",
        },
        {
          _id: "3",
          name: "Flash Sale Alert",
          type: "sms",
          status: "draft",
          audienceCount: 500,
          audienceType: "segment",
          schedulingType: "immediate",
          createdAt: "2024-01-22T11:15:00Z",
          updatedAt: "2024-01-22T11:15:00Z",
        },
      ];

      setCampaigns(mockCampaigns);
      setError(null);
    } catch (err) {
      setError("Failed to load campaigns");
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: Campaign["type"]) => {
    switch (type) {
      case "email":
        return Mail;
      case "sms":
        return Phone;
      case "push":
        return MessageCircle;
      default:
        return Mail;
    }
  };

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "draft":
        return Pencil;
      case "scheduled":
        return Clock;
      case "sending":
        return Play;
      case "sent":
        return CheckCircle;
      case "paused":
        return Pause;
      case "failed":
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "draft":
        return "text-gray-500 bg-gray-100";
      case "scheduled":
        return "text-blue-500 bg-blue-100";
      case "sending":
        return "text-yellow-500 bg-yellow-100";
      case "sent":
        return "text-green-500 bg-green-100";
      case "paused":
        return "text-orange-500 bg-orange-100";
      case "failed":
        return "text-red-500 bg-red-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateOpenRate = (metrics?: Campaign["metrics"]) => {
    if (!metrics || metrics.sent === 0) return 0;
    return Math.round((metrics.opened / metrics.sent) * 100);
  };

  const calculateClickRate = (metrics?: Campaign["metrics"]) => {
    if (!metrics || metrics.opened === 0) return 0;
    return Math.round((metrics.clicked / metrics.opened) * 100);
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === "all") return true;
    return campaign.status === filter;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "type":
        return a.type.localeCompare(b.type);
      case "status":
        return a.status.localeCompare(b.status);
      case "createdAt":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage your marketing campaigns
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-5 w-5" />
          New Campaign
        </Link>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Campaigns</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="paused">Paused</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaign List */}
        {sortedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No campaigns
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first campaign.
            </p>
            <div className="mt-6">
              <Link
                to="/campaigns/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {sortedCampaigns.map((campaign) => {
                const TypeIcon = getTypeIcon(campaign.type);
                const StatusIcon = getStatusIcon(campaign.status);

                return (
                  <li key={campaign._id} className="hover:bg-gray-50">
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          {/* Type Icon */}
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <TypeIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                          </div>

                          {/* Campaign Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {campaign.name}
                              </p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {campaign.status}
                              </span>
                            </div>
                            {campaign.subject && (
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {campaign.subject}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>
                                {campaign.audienceCount.toLocaleString()}{" "}
                                recipients
                              </span>
                              <span>•</span>
                              <span>{formatDate(campaign.createdAt)}</span>
                              {campaign.scheduledDate && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Scheduled:{" "}
                                    {formatDate(campaign.scheduledDate)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Metrics */}
                          {campaign.metrics && (
                            <div className="hidden md:flex items-center space-x-6 text-sm">
                              <div className="text-center">
                                <div className="text-gray-900 font-medium">
                                  {calculateOpenRate(campaign.metrics)}%
                                </div>
                                <div className="text-gray-500">Open Rate</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-900 font-medium">
                                  {calculateClickRate(campaign.metrics)}%
                                </div>
                                <div className="text-gray-500">Click Rate</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="flex items-center space-x-1">
                            {/* View */}
                            <button
                              onClick={() =>
                                navigate(`/campaigns/${campaign._id}`)
                              }
                              className="p-2 text-gray-400 hover:text-gray-500"
                              title="View campaign"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Analytics */}
                            {campaign.status === "sent" && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/campaigns/${campaign._id}/analytics`
                                  )
                                }
                                className="p-2 text-gray-400 hover:text-gray-500"
                                title="View analytics"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </button>
                            )}

                            {/* Edit (only for draft campaigns) */}
                            {campaign.status === "draft" && (
                              <button
                                onClick={() =>
                                  navigate(`/campaigns/${campaign._id}/edit`)
                                }
                                className="p-2 text-gray-400 hover:text-gray-500"
                                title="Edit campaign"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}

                            {/* Start/Pause (for scheduled or paused campaigns) */}
                            {(campaign.status === "scheduled" ||
                              campaign.status === "paused") && (
                              <button
                                onClick={() => {
                                  // Handle start/resume campaign
                                }}
                                className="p-2 text-green-400 hover:text-green-500"
                                title={
                                  campaign.status === "paused"
                                    ? "Resume campaign"
                                    : "Start campaign"
                                }
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}

                            {/* Pause (for sending campaigns) */}
                            {campaign.status === "sending" && (
                              <button
                                onClick={() => {
                                  // Handle pause campaign
                                }}
                                className="p-2 text-yellow-400 hover:text-yellow-500"
                                title="Pause campaign"
                              >
                                <Pause className="h-4 w-4" />
                              </button>
                            )}

                            {/* Delete (only for draft campaigns) */}
                            {campaign.status === "draft" && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this campaign?"
                                    )
                                  ) {
                                    // Handle delete campaign
                                  }
                                }}
                                className="p-2 text-red-400 hover:text-red-500"
                                title="Delete campaign"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignList;
