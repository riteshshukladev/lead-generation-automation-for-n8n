// functions/routes/auth.js

// require("dotenv").config();

const admin = require("firebase-admin");
const axios = require("axios");
const {
  encryptToken,
  decryptToken,
  isTokenExpired,
} = require("../utils/tokenUtils");
const functions = require("firebase-functions");
const express = require("express");

const router = express.Router();

/**
 * POST /auth/initiate
 * Initiates OAuth flow for a user
 */
router.post("/initiate", async (req, res) => {
  try {
    const { userId, redirectUri } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // ✅ FIXED: Added userinfo scopes for profile access
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.labels",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",

      // Google Drive full access
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.readonly",

      // Google Sheets full access
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ];

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri, // <-- use the passed-in redirectUri
      scope: scopes.join(" "),
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      state: userId,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    res.json({
      authUrl,
      state: userId,
      message: "Redirect user to this URL to start OAuth flow",
    });
  } catch (error) {
    console.error("OAuth initiation error:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
});

/**
 * POST /auth/callback
 * Handles OAuth callback and exchanges code for tokens
 */
// functions/routes/auth.js
router.post("/callback", async (req, res) => {
  const { code, state, redirectUri } = req.body;
  const userId = state;

  if (!code || !userId || !redirectUri) {
    return res
      .status(400)
      .json({ error: "code, state, and redirectUri required" });
  }

  console.log("OAuth callback received:", {
    code: code.substring(0, 20) + "...",
    userId,
    redirectUri,
  });

  // Check if user tokens already exist (idempotency check)
  const db = admin.firestore();
  const existingTokenDoc = await db.collection("user_tokens").doc(userId).get();

  if (existingTokenDoc.exists) {
    const tokenData = existingTokenDoc.data();
    console.log(
      `User ${userId} already has tokens, returning existing connection`
    );
    return res.json({
      success: true,
      message: "Gmail account already connected",
      userEmail: tokenData.user_email,
      scopes: tokenData.scope?.split(" ") || [],
      existing: true,
    });
  }

  try {
    console.log("Exchanging code for tokens…");
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in, scope } =
      tokenResponse.data;
    console.log(`Token exchange successful. Scope: ${scope}`);

    // Fetch user info
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const userInfo = userInfoResponse.data;
    console.log("User info retrieved:", {
      email: userInfo.email,
      name: userInfo.name,
    });

    // Store tokens
    await saveUserTokens(userId, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      scope,
      userEmail: userInfo.email,
      userName: userInfo.name,
    });

    return res.json({
      success: true,
      message: "Gmail account connected successfully",
      userEmail: userInfo.email,
      scopes: scope.split(" "),
    });
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);

    if (err.response?.data?.error === "invalid_grant") {
      return res.status(400).json({
        error: "Authorization code already used",
        message:
          "This OAuth code has already been exchanged for tokens. Please start the OAuth flow again.",
        details: err.response?.data || err.message,
      });
    }

    return res.status(500).json({
      error: "Failed to complete OAuth flow",
      details: err.response?.data || err.message,
    });
  }
});

/**
 * DELETE /auth/revoke/:userId
 * Revokes user's OAuth tokens and deletes from storage
 */
router.delete("/revoke/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = admin.firestore();

    const userTokenDoc = await db.collection("user_tokens").doc(userId).get();
    if (!userTokenDoc.exists) {
      return res.status(404).json({ error: "User tokens not found" });
    }

    const tokenData = userTokenDoc.data();
    const refreshToken = decryptToken(tokenData.refresh_token);

    // Revoke tokens with Google
    try {
      await axios.post(
        `https://oauth2.googleapis.com/revoke?token=${refreshToken}`
      );
    } catch (revokeError) {
      console.warn("Google token revocation failed:", revokeError.message);
    }

    // Delete tokens from Firestore
    await db.collection("user_tokens").doc(userId).delete();

    res.json({
      success: true,
      message: "Gmail account disconnected successfully",
    });
  } catch (error) {
    console.error("Token revocation error:", error);
    res.status(500).json({ error: "Failed to revoke tokens" });
  }
});

/**
 * GET /auth/status/:userId
 * Check if user has valid OAuth tokens
 */
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = admin.firestore();

    const userTokenDoc = await db.collection("user_tokens").doc(userId).get();
    if (!userTokenDoc.exists) {
      return res.json({
        connected: false,
        message: "No Gmail account connected",
      });
    }

    const tokenData = userTokenDoc.data();
    const expired = isTokenExpired(tokenData.expires_at);

    res.json({
      connected: true,
      userEmail: tokenData.user_email,
      userName: tokenData.user_name,
      scopes: tokenData.scope?.split(" ") || [],
      tokenExpired: expired,
      expiresAt: new Date(tokenData.expires_at).toISOString(),
      connectedAt: new Date(tokenData.created_at).toISOString(),
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to check connection status" });
  }
});

/**
 * Helper function to save user tokens
 */
async function saveUserTokens(userId, tokenData) {
  const db = admin.firestore();

  await db
    .collection("user_tokens")
    .doc(userId)
    .set(
      {
        access_token: encryptToken(tokenData.accessToken),
        refresh_token: encryptToken(tokenData.refreshToken),
        expires_at: Date.now() + tokenData.expiresIn * 1000,
        scope: tokenData.scope,
        user_email: tokenData.userEmail,
        user_name: tokenData.userName,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      { merge: true }
    );

  console.log(`Saved tokens for user: ${userId} (${tokenData.userEmail})`);
}

module.exports = router;
