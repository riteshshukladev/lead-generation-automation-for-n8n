// Load environment variables at the very top
require("dotenv").config();

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const n8nProxyRoutes = require("./routes/n8n");

// Set global options for 2nd gen functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1", // or your preferred region
});

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Remove all timeouts - let requests run indefinitely
app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  res.setHeader("Connection", "keep-alive");
  next();
});

// Configure CORS
app.use(
  cors({
    origin: [
      "https://n8n--automation-468307.web.app",
      "https://n8n--automation-468307.firebaseapp.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "OAuth Token Management",
    environment: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasN8nApiKey: !!process.env.N8N_API_KEY,
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
    },
  });
});

// Add routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const tokenRoutes = require("./routes/tokens");
app.use("/tokens", tokenRoutes);

app.use("/n8n", n8nProxyRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);
  res.status(500).json({
    error: "Internal server error",
    details: error.message,
  });
});

// Export using 2nd gen functions with maximum timeout (60 minutes)
exports.api = onRequest(
  {
    timeoutSeconds: 3600, // 60 minutes (maximum for 2nd gen)
    memory: "1GiB",
    cpu: 1,
    concurrency: 80,
  },
  app
);
