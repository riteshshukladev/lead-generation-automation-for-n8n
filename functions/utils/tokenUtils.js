// functions/utils/tokenUtils.js
require("dotenv").config();

const crypto = require("crypto-js");
const axios = require("axios");

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

/**
 * Encrypt sensitive data before storing in Firestore
 */
function encryptToken(token) {
  if (!token) throw new Error("Token is required for encryption");
  return crypto.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt token when retrieving from Firestore
 */
function decryptToken(encryptedToken) {
  if (!encryptedToken)
    throw new Error("Encrypted token is required for decryption");
  const bytes = crypto.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(crypto.enc.Utf8);
}

/**
 * Refresh Google OAuth token using refresh token
 */
async function refreshGoogleToken(refreshToken) {
  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID, // ← Using process.env now!
        client_secret: process.env.GOOGLE_CLIENT_SECRET, // ← Using process.env now!
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
      scope: response.data.scope,
    };
  } catch (error) {
    console.error(
      "Token refresh error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to refresh token");
  }
}

/**
 * Validate if token is expired (with 5 minute buffer)
 */
function isTokenExpired(expiresAt) {
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return expiresAt < now + buffer;
}

module.exports = {
  encryptToken,
  decryptToken,
  refreshGoogleToken,
  isTokenExpired,
};
