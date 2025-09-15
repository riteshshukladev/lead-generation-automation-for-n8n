import React, { useState } from "react";
import { useGmail } from "../../contexts/GmailContext";

const StartEmailSending = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const {
    selectedDocs,
    AccessToken,
    dynamicMail,
    staticMail,
    subject,
    senderEmail,
    setEmailSendingResponse,
  } = useGmail();

  // Helper function to estimate processing time
  const getEstimatedTime = () => {
    return "Processing... This may take a few minutes";
  };

  const isDataValid = () => {
    return AccessToken && dynamicMail;
  };

  const handleStartScrapping = async () => {
    // Validate required data
    if (!isDataValid()) {
      setError(
        "Missing required data: sheet ID, access token, or email template"
      );
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        sheet_id: selectedDocs.sheet.id,
        sheet_name: selectedDocs?.sheetTab || "Sheet1",
        access_token: AccessToken,
        dynamicMail,
        staticMail,
        subject,
        senderEmail,
        fileData: selectedDocs.drive?.id || null,
        fileName: selectedDocs.drive?.name || null,
      };

      console.log("Sending payload to webhook:", payload);

      const response = await fetch(import.meta.env.VITE_N8N_EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_N8N_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
          setEmailSendingResponse({
            type: "error",
            error: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
        throw new Error(errData.error || "Webhook request failed");
      }

      const data = await response.json();
      setEmailSendingResponse(data);

      setResult(data);
      console.log("Webhook response:", data);
    } catch (err) {
      console.error("Email sending error:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 min-h-48 md:min-h-0">
      <button
        onClick={handleStartScrapping}
        disabled={processing || !isDataValid()}
        className={`px-6 py-3 bg-blue-500 text-white rounded-lg font-medium transition-all duration-200 ${
          !isDataValid() || processing
            ? "opacity-50 cursor-not-allowed bg-gray-400"
            : "hover:bg-blue-600 active:bg-blue-700"
        }`}
      >
        {processing ? "Sending Emails..." : "Send Emails"}
      </button>

      {processing && (
        <div className="mt-4 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="mt-2 text-xs text-gray-600">
            {getEstimatedTime()}
          </span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">Success!</h3>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">Error:</h3>
        </div>
      )}
    </div>
  );
};

export default StartEmailSending;
