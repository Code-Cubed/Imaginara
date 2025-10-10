

const express = require("express");
// ❌ No longer need 'node-fetch' since we'll use the official SDK
const { GoogleGenAI } = require('@google/genai'); 
require("dotenv").config(); 

const router = express.Router();

// Initialize the GoogleGenAI instance using the environment variable
// This should be done once when the file loads
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing from backend .env file!");
}
const ai = new GoogleGenAI({ apiKey });


/**
 * POST /chat
 * Receives the conversation history from the frontend and sends it to the Gemini API.
 * body: { conversation: [ { role: "user"|"bot", text: "..." }, ... ] }
 */
router.post("/chat", async (req, res) => {
  try {
    const { conversation } = req.body;

    if (!conversation || !Array.isArray(conversation)) {
      return res.status(400).json({ error: "Invalid conversation format." });
    }
    
    // Convert the simplified frontend format ({role, text}) to the Gemini API format ({role, parts: [{text}]})
    const geminiContents = conversation.map(msg => ({
      // Gemini expects 'model' for the AI's role, not 'bot'
      role: msg.role === 'user' ? 'user' : 'model', 
      parts: [{ text: msg.text }]
    }));
    
    // The last message (the one the user just sent) is the one to be generated from.
    // The previous messages are the history.
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Use the modern chat-optimized model
        contents: geminiContents, // Pass the entire history
    });

    // Extract AI response
    const aiText = response.text || "Sorry, I couldn't process that.";

    res.json({ aiText });

  } catch (err) {
    console.error("Gemini API Error:", err.message);
    res.status(500).json({ 
        error: "Internal Server Error during AI request.", 
        details: err.message 
    });
  }
});

module.exports = router;