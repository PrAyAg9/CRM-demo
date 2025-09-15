// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  AUTH: {
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    GOOGLE: `${API_BASE_URL}/api/auth/google`,
  },
  CUSTOMERS: {
    STATS: `${API_BASE_URL}/api/customers/stats`,
  },
  SEGMENTS: {
    PREVIEW: `${API_BASE_URL}/api/segments/preview`,
    BASE: `${API_BASE_URL}/api/segments`,
  },
  CAMPAIGNS: {
    BASE: `${API_BASE_URL}/api/campaigns`,
  },
  AI: {
    SEGMENT_SUGGESTIONS: `${API_BASE_URL}/api/ai/segment-suggestions`,
    MESSAGE_SUGGESTIONS: `${API_BASE_URL}/api/ai/message-suggestions`,
    INSIGHTS: `${API_BASE_URL}/api/ai/insights`,
  },
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

export default API_BASE_URL;
