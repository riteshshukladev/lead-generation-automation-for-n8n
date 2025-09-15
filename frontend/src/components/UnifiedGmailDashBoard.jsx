// src/components/UnifiedGmailDashboard.jsx
import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/authContext";
import { useAuth } from "../authContext";
import { useGmail } from "../contexts/GmailContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { gmailService } from "../services/gmailService";
import FileSelectDropDown from "./utilities/FileSelectDropDown";
import GridLayout from "./grid-components/GridLayout";
export default function UnifiedGmailDashboard({ userId }) {
  const { user } = useAuth();
  const {
    loading,
    error,
    status,
    statusLoading,
    isProcessingCallback,
    callbackMessage,
    connectGmail,
    handleCallback,
    getStatus,
    disconnectGmail,
    setIsProcessingCallback,
  } = useGmail();

  const location = useLocation();
  const navigate = useNavigate();
  const hasCallbackRun = useRef(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Check for OAuth callback or fetch status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state && !hasCallbackRun.current) {
      hasCallbackRun.current = true;
      processCallback(code, state);
    } else {
      getStatus(userId);
    }
  }, [location.search]);

  // Process OAuth callback
  const processCallback = async (code, state) => {
    try {
      await handleCallback(code, state);
      setTimeout(() => {
        navigate("/", { replace: true });
        setIsProcessingCallback(false);
        getStatus(userId);
      }, 2000);
    } catch (err) {
      setIsProcessingCallback(false);
    }
  };

  // Callback processing screen
  if (isProcessingCallback) {
    return (
      <div className="bg-bg-primary w-full min-h-screen flex flex-col items-center text-center md:px-4 md:py-4 gap-2">
        <div className="flex flex-row justify-between items-center text-center w-full font-medium px-2 py-2 md:px-4 md:py-4">
          <p className="text-sm md:text-base para text-center text-black/80 font-medium">
            {user?.displayName || user?.email || "User"}
          </p>
          <a
            onClick={handleLogout}
            className="para text-sm md:text-base text-center text-black pb-[1px] border-b-black cursor-pointer"
          >
            Logout
          </a>
        </div>
        <div className="text-center pt-2">
          <p className="para text-center text-black">
            Processing your Gmail connection...
          </p>
          {callbackMessage && (
            <p className="text-sm md:text-base text-bg-success text-center">
              {callbackMessage}
            </p>
          )}
          {error && (
            <p className="text-sm md:text-base text-bg-error text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="w-full min-h-screen bg-bg-primary mx-auto">
      {/* Header */}
      <div className="flex flex-row justify-between items-center text-center w-full font-medium px-2 py-2 md:px-4 md:py-4">
        <p className="text-sm md:text-base para text-center text-black/80 font-medium">
          {user?.displayName || user?.email || "User"}
        </p>
        <a
          onClick={handleLogout}
          className="para text-sm md:text-base text-center text-black pb-[1px] border-b border-black cursor-pointer"
        >
          Logout
        </a>
      </div>

      {/* Content */}
      {statusLoading ? (
        <div className="text-center pt-3">
          <p className="para text-center text-black">Working on it...</p>
        </div>
      ) : error ? (
        <div className="text-center pt-3">
          <p className="text-sm md:text-base text-bg-error text-center">
            {error}
          </p>
          <button onClick={() => getStatus(userId)}>Retry</button>
        </div>
      ) : status?.connected ? (
        <div className="flex flex-wrap flex-col justify-center items-center gap-4 md:gap-8 pt-1">
          <div className="flex flex-wrap flex-col justify-center items-center gap-1 pt-1">
            <button
              onClick={() => disconnectGmail(userId)}
              disabled={statusLoading}
            >
              {statusLoading ? "Disconnecting..." : "Disconnect Gmail"}
            </button>
            <p className="text-xs md:text-base text-bg-success text-center">
              Connected: {status.userEmail}
            </p>
          </div>
          <FileSelectDropDown userId={userId} />
          <GridLayout />
        </div>
      ) : (
        <div className="text-center pt-4 flex flex-wrap flex-col justify-center items-center gap-1">
          <button onClick={() => connectGmail(userId)} disabled={loading}>
            {loading ? "Connecting..." : "Connect Gmail"}
          </button>
          <p className="text-xs md:text-base text-bg-error text-center">
            No accounts connected.
          </p>
          {error && (
            <p className="text-sm md:text-base text-bg-error text-center">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
