const express = require("express");
const fetch = require("node-fetch"); // ensure node-fetch v2
require("dotenv").config();

const router = express.Router();

/**
 * POST /api/gemini/chat
 * body: { conversation: [ { role: "user"|"bot", text: "..." }, ... ] }
 */
router.post("/chat", async (req, res) => {
  try {
    const { conversation } = req.body;

    // Validate input
    if (!conversation || !Array.isArray(conversation)) {
      return res.status(400).json({ error: "Invalid conversation format." });
    }

    // Build prompt text
    let promptText = "";
    conversation.forEach((msg) => {
      if (msg.role === "user") promptText += `User: ${msg.text}\n`;
      else promptText += `AI: ${msg.text}\n`;
    });
    promptText += "AI:"; // AI should respond next

    // Gemini API endpoint
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText?key=${process.env.GEMINI_API_KEY}`;

    // Call Gemini
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: { text: promptText },
        temperature: 0.7,
        maxOutputTokens: 300
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    // Extract AI response
    const aiText = data?.candidates?.[0]?.output || "Sorry, I couldn't process that.";

    res.json({ aiText });
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
