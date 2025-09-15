// src/services/gmailService.js
const BASE_URL = `${import.meta.env.VITE_API_URL}`;
// const BASE_URL =
//   "http://localhost:5001/n8n-gmail-automation-468307/us-central1/api";

export const gmailService = {
  async fetchSheetNames(sheetId, accessToken) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch sheet names");
    const data = await response.json();
    return data.sheets.map((s) => s.properties.title);
  },

  async initiateOAuth(userId) {
    const response = await fetch(`${BASE_URL}/auth/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        redirectUri: `${window.location.origin}/auth/callback`,
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async handleCallback(code, state) {
    const response = await fetch(`${BASE_URL}/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        state,
        redirectUri: `${window.location.origin}/auth/callback`,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "OAuth callback failed");
    }
    return response.json();
  },

  async getStatus(userId) {
    const response = await fetch(`${BASE_URL}/auth/status/${userId}`);
    if (!response.ok) throw new Error("Failed to get connection status");
    return response.json();
  },

  async disconnect(userId) {
    const response = await fetch(`${BASE_URL}/auth/revoke/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to disconnect Gmail account");
    return response.json();
  },

  // ...existing code...

  // ...existing code...
  async getDriveFiles(userId) {
    // Get a valid access token from your backend
    const tokenRes = await fetch(`${BASE_URL}/tokens/${userId}/google`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_N8N_API_KEY}`,
      },
    });
    if (!tokenRes.ok) throw new Error("Failed to get access token");
    const { access_token } = await tokenRes.json();

    // Fetch files from Google Drive
    const driveRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,owners,modifiedTime)",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    if (!driveRes.ok) throw new Error("Failed to fetch Drive files");
    const files = await driveRes.json();
    return { files: files.files, access_token };
  },

  async getSheets(userId) {
    // Get a valid access token from your backend
    const tokenRes = await fetch(`${BASE_URL}/tokens/${userId}/google`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_N8N_API_KEY}`,
      },
    });
    if (!tokenRes.ok) throw new Error("Failed to get access token");
    const { access_token } = await tokenRes.json();

    const sheetsRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,owners,modifiedTime)",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    if (!sheetsRes.ok) throw new Error("Failed to fetch Google Sheets");
    const files = await sheetsRes.json(); // <-- Parse response
    return { files: files.files, access_token };
  },
  // ...existing code...

  // ...existing code...

  /**
   * Trigger n8n workflow to write data to Google Sheet
   * @param {Array} queries - Array of query objects
   * @param {string} sheetId - Google Sheet ID
   * @param {string} [accessToken] - Optional Google access token if n8n needs it
   */
  // async triggerSheetWriteWebhook(sheetId, accessToken) {
  //   const SHEET_WEBHOOK_URL = import.meta.env.VITE_N8N_SHEET_WEBHOOK_URL;

  //   const payload = {
  //     // queries,
  //     sheet_id: sheetId,
  //     sheet_name: "Sheet1",
  //     access_token: accessToken || null, // Use provided token or null if not needed
  //   };

  //   const response = await fetch(SHEET_WEBHOOK_URL, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${import.meta.env.VITE_N8N_API_KEY}`,
  //     },
  //     body: JSON.stringify(payload),
  //   });

  //   if (!response.ok) {
  //     const errData = await response.json();
  //     throw new Error(errData.error || "Sheet webhook request failed");
  //   }
  //   return response.json();
  // },
};
