// functions/services/tokenService.js

require("dotenv").config();
const admin = require("firebase-admin");
const {
  decryptToken,
  encryptToken,
  refreshGoogleToken,
  isTokenExpired,
} = require("../utils/tokenUtils");

class TokenService {
  /**
   * Get valid access token for user, refreshing if necessary
   */
  async getValidToken(userId) {
    const db = admin.firestore();

    try {
      const userTokenDoc = await db.collection("user_tokens").doc(userId).get();

      if (!userTokenDoc.exists) {
        throw new Error("User tokens not found");
      }

      const tokenData = userTokenDoc.data();

      // If token is not expired, return it
      if (!isTokenExpired(tokenData.expires_at)) {
        return {
          access_token: decryptToken(tokenData.access_token),
          expires_at: new Date(tokenData.expires_at).toISOString(),
          user_email: tokenData.user_email,
        };
      }

      // Token is expired, refresh it
      console.log(`Refreshing expired token for user: ${userId}`);

      const refreshToken = decryptToken(tokenData.refresh_token);
      const newTokens = await refreshGoogleToken(refreshToken);

      // Update stored tokens
      const newExpiresAt = Date.now() + newTokens.expires_in * 1000;

      // ...existing code...
      await db
        .collection("user_tokens")
        .doc(userId)
        .update({
          access_token: encryptToken(newTokens.access_token),
          expires_at: newExpiresAt,
          updated_at: Date.now(),
          refresh_count: (tokenData.refresh_count || 0) + 1, // <-- manual increment
        });
      // ...existing code...

      return {
        access_token: newTokens.access_token,
        expires_at: new Date(newExpiresAt).toISOString(),
        user_email: tokenData.user_email,
        refreshed: true,
      };
    } catch (error) {
      console.error(`Token service error for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate API key for n8n access
   */
  validateApiKey(providedKey) {
    const functions = require("firebase-functions");
    const validKey = process.env.N8N_API_KEY;

    if (!validKey || !providedKey) {
      return false;
    }

    return providedKey.replace("Bearer ", "") === validKey;
  }
}

module.exports = new TokenService();
