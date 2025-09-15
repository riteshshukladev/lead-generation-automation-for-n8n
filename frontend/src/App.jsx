// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./authContext";
import Login from "./components/auth/Login";
import { GmailProvider } from "./contexts/GmailContext";

import UnifiedGmailDashboard from "./components/UnifiedGmailDashBoard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-bg-primary w-full min-h-screen flex flex-col items-center justify-center text-center text-black text-xl">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        <GmailProvider>
          <Routes>
            {/* Single component handles all Gmail states */}
            <Route
              path="/"
              element={<UnifiedGmailDashboard userId={user.uid} />}
            />
            <Route
              path="/auth/callback"
              element={<UnifiedGmailDashboard userId={user.uid} />}
            />
            <Route
              path="/dashboard"
              element={<UnifiedGmailDashboard userId={user.uid} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GmailProvider>
      ) : (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </Router>
  );
}
