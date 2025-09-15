import React, { useState, useRef } from "react";
import { useGmail } from "../../contexts/GmailContext";

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ---------- helpers ----------
const safeJSONParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * Extracts { status, message } from various possible shapes:
 * - { status, message }
 * - { parameters: { responseBody: '{"status":"...","message":"..."}' } }
 * - stringified entire payload (we'll parse twice if needed)
 */
const extractStatusAndMessage = (payload) => {
  if (!payload) return null;

  // 1) If payload is a string, try parsing it
  let obj = typeof payload === "string" ? safeJSONParse(payload) : payload;
  if (!obj) return null;

  // 2) Direct fields
  if (typeof obj.status === "string" || typeof obj.message === "string") {
    return {
      status: obj.status ?? null,
      message: obj.message ?? null,
    };
  }

  // 3) n8n Respond to Webhook shape
  const body = obj?.parameters?.responseBody;
  if (typeof body === "string") {
    const inner = safeJSONParse(body);
    if (inner && (inner.status || inner.message)) {
      return {
        status: inner.status ?? null,
        message: inner.message ?? null,
      };
    }
  } else if (typeof body === "object" && body) {
    if (body.status || body.message) {
      return {
        status: body.status ?? null,
        message: body.message ?? null,
      };
    }
  }

  // 4) Sometimes servers wrap data
  const maybeData = obj.data || obj.result || obj.payload;
  if (maybeData) return extractStatusAndMessage(maybeData);

  return null;
};

// API Key validation function
const validateApiKey = async (apiKey) => {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Test" }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 5 },
        }),
      }
    );
    if (r.ok) return { valid: true };
    const e = await r.json().catch(() => ({}));
    if (r.status === 403)
      return {
        valid: false,
        error: "API key is invalid or lacks access to Gemini",
      };
    if (r.status === 429)
      return { valid: false, error: "Rate limit exceeded. Try again later" };
    if (r.status === 500)
      return {
        valid: false,
        error: "Google AI service temporarily unavailable",
      };
    return {
      valid: false,
      error: e?.error?.message || `Request failed: ${r.status}`,
    };
  } catch {
    return { valid: false, error: "Network error or invalid API key format" };
  }
};

export default function StartEmailScrapping() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { raw, info }
  const [error, setError] = useState(null);

  const { fileData, selectedDocs, AccessToken } = useGmail();
  const [useAIClassification, setUseAIClassification] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");

  const [apiKeyValid, setApiKeyValid] = useState(null);
  const [validatingApi, setValidatingApi] = useState(false);
  const [showApiValidationResult, setShowApiValidationResult] = useState(false);

  const inFlightRef = useRef(false);

  // Function to start scrapping - wait indefinitely for response
  const handleStartScrapping = async () => {
    if (inFlightRef.current) return;

    setProcessing(true);
    setResult(null);
    setError(null);
    inFlightRef.current = true;

    const payload = {
      queries: Array.isArray(fileData) ? fileData : [],
      sheet_id: selectedDocs.sheet?.id,
      sheet_name: selectedDocs?.sheetTab || "Sheet1",
      access_token: AccessToken,
      ai_classification: !!useAIClassification,
      llm_api_key: aiApiKey || "",
    };

    try {
      // No timeout - just wait for response
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_N8N_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("Raw response text:", text);
      let json = null;

      if (text && text.trim()) {
        // try as JSON, then as de-quoted JSON, else keep raw
        json = safeJSONParse(text) ?? safeJSONParse(text.replace(/^"|"$/g, ""));
        if (!json) json = { error: "Failed to parse response", rawData: text };
      } else {
        json = { error: "Empty response" };
      }

      const info = extractStatusAndMessage(json); // <-- pull {status,message}
      setResult({ raw: json, info });
    } catch (fetchError) {
      console.error("Request failed:", fetchError);
      setError(fetchError.message);
    } finally {
      setProcessing(false);
      inFlightRef.current = false;
    }
  };

  const handleSaveApiKey = async () => {
    if (!aiApiKey.trim()) {
      setError("Please enter an API key");
      return;
    }
    setValidatingApi(true);
    setError(null);

    const validation = await validateApiKey(aiApiKey);
    setValidatingApi(false);
    if (validation.valid) {
      setApiKeyValid(true);
    } else {
      setApiKeyValid(false);
      setError(validation.error);
    }
    setShowApiValidationResult(true);
    setTimeout(() => setShowApiValidationResult(false), 2500);
  };

  const status = result?.info?.status ?? null;
  const message = result?.info?.message ?? null;
  const isSuccess =
    typeof status === "string" && status.toLowerCase() === "success";

  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 p-4 min-h-48 md:min-h-0">
      {/* Button to trigger the scraping */}
      <button
        type="button"
        onClick={handleStartScrapping}
        disabled={processing || apiKeyValid === false}
        className={`px-4 py-2 rounded border border-black uppercase tracking-wide text-sm
          ${
            processing || apiKeyValid === false
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-black hover:text-white transition"
          }`}
      >
        {processing ? "generating leads..." : "start lead generation"}
      </button>

      {/* Show the loading spinner */}
      {processing && (
        <div className="mt-4 flex flex-col items-center">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
          <span className="mt-2 text-xs text-gray-600">Working...</span>
        </div>
      )}

      {/* Show extracted status/message AFTER the loader stops */}

      {/* AI Classification Checkbox */}
      {!processing && (
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="aiClassification"
            checked={useAIClassification}
            onChange={(e) => setUseAIClassification(e.target.checked)}
            className="h-4 w-4 border border-black rounded bg-white accent-black focus:ring-2 focus:ring-gray-300"
            style={{ accentColor: "black" }}
          />
          <label htmlFor="aiClassification" className="text-sm text-gray-700">
            Enable AI Classification
          </label>
        </div>
      )}

      {useAIClassification && !processing && (
        <div className="mt-4 w-full max-w-xs flex flex-col justify-center items-center">
          <div className="flex items-center space-x-2">
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => {
                setAiApiKey(e.target.value);
                setApiKeyValid(null);
              }}
              placeholder="Enter Gemini API key"
              className="px-3 py-1 border border-black rounded text-sm min-w-[200px] outline-none text-black placeholder-gray-500"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={validatingApi || !aiApiKey.trim()}
              className={`!py-0 !px-0 !text-base !font-medium !bg-transparent !transition-colors !border-none ${
                validatingApi || !aiApiKey.trim()
                  ? "!cursor-not-allowed opacity-50"
                  : "!cursor-pointer"
              }`}
              style={{
                paddingBottom: "4px",
                borderBottom: "1px solid black",
              }}
            >
              {validatingApi ? "Validating..." : "Validate Key"}
            </button>
          </div>
          {showApiValidationResult && (
            <div
              className={`mt-2 text-sm ${
                apiKeyValid ? "text-green-600" : "text-red-600"
              }`}
            >
              {apiKeyValid === true && "API key is valid!"}
              {apiKeyValid === false && "API key is invalid."}
            </div>
          )}
        </div>
      )}

      {!processing && result?.info && (
        <div
          className={`mt-4 w-full max-w-2xl p-4 rounded border ${
            isSuccess
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="text-sm font-semibold">
            {isSuccess ? "✅" : "ℹ️"}
            <span className={isSuccess ? "text-green-700" : "text-yellow-700"}>
              {status || "unknown"}
            </span>
          </div>
          {message && (
            <div className="mt-1 text-sm text-gray-800">{message}</div>
          )}
        </div>
      )}

      {/* Show the error message */}
      {error && !processing && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded max-w-2xl w-full">
          <div className="text-red-600 text-sm">❌ {error}</div>
        </div>
      )}
    </div>
  );
}
