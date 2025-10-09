const express = require("express");
const axios = require("axios");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Hugging Face API setup
const HF_API_URL = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224";
const HF_API_KEY = process.env.HF_API_KEY;

router.post("/generate-tags", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    // Send image to Hugging Face model
    const response = await axios.post(HF_API_URL, req.file.buffer, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
    });

    const predictions = response.data;

    // Extract and clean top tags
    const tags = predictions
      .filter((p) => p.score > 0.1)
      .map((p) => p.label.toLowerCase());

    res.json({ tags });
  } catch (error) {
    console.error("AI Tagging Error:", error.message);
    res.status(500).json({ error: "AI Tag generation failed" });
  }
});

module.exports = router;
