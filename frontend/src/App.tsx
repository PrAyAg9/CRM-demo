import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Configure axios
import "./utils/axios";

// Context providers
import { AuthProvider } from "./contexts/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Campaigns from "./pages/Campaigns";
import Segments from "./pages/Segments";
import Analytics from "./pages/Analytics";
import AIFeatures from "./pages/AIFeatures";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              <Route
                path="/customers"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Customers />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              <Route
                path="/campaigns/*"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Campaigns />
                    </Layout>
                  // </ProtectedRoute>  
                }
              />

              <Route
                path="/segments"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Segments />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              <Route
                path="/ai-features"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <AIFeatures />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Analytics />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  // <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  // </ProtectedRoute>
                }
              />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
