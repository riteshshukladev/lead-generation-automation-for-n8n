const express = require("express");
const axios = require("axios");
const router = express.Router();

const N8N_BASE_URL = "http://56.228.29.170:5678";

// Proxy for lead generation webhook - no timeout, wait indefinitely
router.post("/webhook/lead-generation", async (req, res) => {
  try {
    console.log("Proxying lead generation request:", req.body);

    // Keep connection alive but no timeout
    res.setHeader("Connection", "keep-alive");

    const response = await axios.post(
      `${N8N_BASE_URL}/webhook/7uk8Pg4BtgPf8Fpm`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        timeout: 0, // No timeout - wait indefinitely
      }
    );

    console.log("n8n response received:", response.data);

    // Just return whatever n8n sends back
    res.json(response.data);
  } catch (error) {
    console.error("n8n lead generation error:", error);

    // Return any error that occurs
    res.status(500).json({
      error: "Lead generation failed",
      details: error.message,
      response: error.response?.data || null,
    });
  }
});

// Proxy for sheet writing webhook - no timeout
router.post("/webhook/sheet-write", async (req, res) => {
  try {
    console.log("Proxying sheet write request:", req.body);

    res.setHeader("Connection", "keep-alive");

    const response = await axios.post(
      `${N8N_BASE_URL}/webhook/sheet-write`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        timeout: 0, // No timeout
      }
    );

    console.log("n8n sheet write response received");
    res.json(response.data);
  } catch (error) {
    console.error("n8n sheet write error:", error);
    res.status(500).json({
      error: "Sheet write failed",
      details: error.message,
      response: error.response?.data || null,
    });
  }
});

// Proxy for email sending webhook - no timeout
router.post("/webhook/send-emails", async (req, res) => {
  try {
    console.log("Proxying email send request:", req.body);

    res.setHeader("Connection", "keep-alive");

    const response = await axios.post(
      `${N8N_BASE_URL}/webhook/send-emails`,
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        timeout: 0, // No timeout
      }
    );

    console.log("n8n email send response received");
    res.json(response.data);
  } catch (error) {
    console.error("n8n email send error:", error);
    res.status(500).json({
      error: "Email send failed",
      details: error.message,
      response: error.response?.data || null,
    });
  }
});

module.exports = router;
