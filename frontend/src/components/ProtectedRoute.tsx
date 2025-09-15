import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  console.log("🛡️ ProtectedRoute check:", {
    isAuthenticated,
    loading,
    hasUser: !!user,
    currentPath: window.location.pathname,
  });

  if (loading) {
    console.log("⏳ Still loading auth...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("❌ Not authenticated, redirecting to login...");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ Authenticated, rendering protected content...");
  return <>{children}</>;
};

export default ProtectedRoute;
