// src/contexts/GmailContext.jsx
import React, { createContext, useContext, useState } from "react";
import { gmailService } from "../services/gmailService";

const GmailContext = createContext();

export function GmailProvider({ children }) {
  // Connection states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  // Status states
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Callback states
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [callbackMessage, setCallbackMessage] = useState("");
  const [selectedDocs, setSelectedDocs] = useState({
    drive: "",
    sheet: "",
    sheetTab: "",
  });
  const [AccessToken, setAccessToken] = useState("");
  const [driveFiles, setDriveFiles] = useState([]);
  const [sheetFiles, setSheetFiles] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState("");
  const [fileData, setFileData] = useState(null);
  const [dynamicMail, setDynamicMail] = useState(
    "Hello {name},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nTeam"
  );
  const [staticMail, setStaticMail] = useState(
    "Hello,\n\nWelcome to our platform!\n\nBest regards,\nTeam"
  );

  const [subject, setSubject] = useState("Welcome to our platform!");
  const [senderEmail, setSenderEmail] = useState("");

  const [emailSendingResponse, setEmailSendingResponse] = useState("");
  // Connect Gmail
  const connectGmail = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const { authUrl } = await gmailService.initiateOAuth(userId);
      window.location.href = authUrl;
    } catch (err) {
      setError("Failed to start OAuth flow: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback
  const handleCallback = async (code, state) => {
    setIsProcessingCallback(true);
    try {
      const data = await gmailService.handleCallback(code, state);
      setCallbackMessage(`Gmail connected successfully: ${data.userEmail}`);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get Gmail status
  const getStatus = async (userId) => {
    setStatusLoading(true);
    setError(null);
    try {
      const data = await gmailService.getStatus(userId);
      setStatus(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setStatusLoading(false);
    }
  };

  // Disconnect Gmail
  const disconnectGmail = async (userId) => {
    setStatusLoading(true);
    setError(null);
    try {
      await gmailService.disconnect(userId);
      await getStatus(userId); // Refresh status
    } catch (err) {
      setError(err.message);
    }
  };

  const value = {
    // States
    loading,
    error,
    status,
    statusLoading,
    isProcessingCallback,
    callbackMessage,
    selectedDocs,
    setSelectedDocs,
    driveFiles,
    setDriveFiles,
    sheetFiles,
    setSheetFiles,
    AccessToken,
    setAccessToken,
    dynamicMail,
    setDynamicMail,
    staticMail,
    setStaticMail,
    sheetNames,
    setSheetNames,
    subject,
    setSubject,
    senderEmail,
    setSenderEmail,
    emailSendingResponse,
    setEmailSendingResponse,

    fileName,
    setFileName,
    isLoading,
    setIsLoading,
    validationStatus,
    setValidationStatus,
    fileData,
    setFileData,
    // Actions
    connectGmail,
    handleCallback,
    getStatus,
    disconnectGmail,
    setIsProcessingCallback,
    setError,
  };

  return (
    <GmailContext.Provider value={value}>{children}</GmailContext.Provider>
  );
}

export const useGmail = () => {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error("useGmail must be used within GmailProvider");
  }
  return context;
};
