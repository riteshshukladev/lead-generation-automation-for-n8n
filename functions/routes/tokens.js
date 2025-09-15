// functions/routes/tokens.js
const express = require("express");
const tokenService = require("../services/tokenService");
const admin = require("firebase-admin");

const router = express.Router();

/**
 * Authentication middleware for n8n requests
 */
const authenticateN8N = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!tokenService.validateApiKey(authHeader)) {
    return res.status(401).json({
      error: "Unauthorized - Invalid API key",
      hint: "Include Authorization: Bearer YOUR_N8N_API_KEY header",
    });
  }

  next();
};

/**
 * GET /tokens/:userId/google
 * Get valid Gmail access token for user (for n8n)
 */
router.get("/:userId/google", authenticateN8N, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get valid token (refreshes automatically if needed)
    const tokenResult = await tokenService.getValidToken(userId);

    res.json({
      access_token: tokenResult.access_token,
      expires_at: tokenResult.expires_at,
      user_email: tokenResult.user_email,
      token_type: "Bearer",
    });
  } catch (error) {
    console.error("Token retrieval error:", error);

    if (error.message === "User tokens not found") {
      return res.status(404).json({
        error: "User not connected",
        message: "User has not connected their Gmail account",
        action: "redirect_to_oauth",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to retrieve user token",
    });
  }
});

module.exports = router;
