// src/pages/AuthCallback.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false); // Prevent double execution

  useEffect(() => {
    async function handleOAuthCallback() {
      // Prevent double execution
      if (hasRun.current) {
        console.log("OAuth callback already processed, skipping...");
        return;
      }
      hasRun.current = true;

      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const redirectUri = `${window.location.origin}/auth/callback`;

      if (!code || !state) {
        setError("Missing code or state in callback URL.");
        setLoading(false);
        return;
      }

      console.log("Processing OAuth callback with code:", code);

      try {
        const baseUrl = `${import.meta.env.VITE_API_URL}`;
        const response = await fetch(`${baseUrl}/auth/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state, redirectUri }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "OAuth callback failed");
        }

        const data = await response.json();
        setMessage(`Gmail connected: ${data.userEmail}`);

        // Optional: Redirect to dashboard after 2 seconds
        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    handleOAuthCallback();
  }, []); // Remove location.search dependency to prevent re-runs

  return (
    <div>
      {loading && <p>Connecting your Gmail account...</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && (
        <div>
          <button onClick={() => navigate("/")}>Go Back Home</button>
          <button onClick={() => navigate("/dashboard")}>View Dashboard</button>
        </div>
      )}
    </div>
  );
}
