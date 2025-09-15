import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import { API_ENDPOINTS, buildApiUrl } from "../utils/api";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🚀 AuthProvider mounted, starting auth check...");
    checkAuthStatus();

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("auth") === "success") {
      console.log("🎉 OAuth callback detected!");
      // Remove auth parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      // Force re-check auth status after OAuth success
      setTimeout(() => {
        console.log("🔄 Re-checking auth after OAuth success...");
        checkAuthStatus();
      }, 100);
    }
  }, []);

  const checkAuthStatus = async () => {
    console.log("🔍 Checking auth status...");
    try {
      // For cookie-based authentication, we don't need to check localStorage
      // The cookies are automatically sent with requests

      // Verify authentication with backend using cookies
      console.log("📞 Making request to:", API_ENDPOINTS.AUTH.PROFILE);
      const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE);
      console.log("✅ Auth success:", response.data);
      setUser(response.data.user);
    } catch (error: any) {
      console.error("❌ Auth check failed:", error);
      console.log("📊 Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      // User is not authenticated, this is normal for initial page load
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    try {
      // Redirect directly to Google OAuth without preflight check
      // The backend will handle any configuration errors
      window.location.href = API_ENDPOINTS.AUTH.GOOGLE;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initiate login.";
      alert(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await axios.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // For cookie-based auth, the backend will clear the cookies
      setUser(null);
      window.location.href = "/login";
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
