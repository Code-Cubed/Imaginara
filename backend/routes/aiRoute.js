// backend/routes/aiRoute.js
import express from "express";
import axios from "axios";
import multer from "multer";

const router = express.Router();

// ✅ Multer setup for memory storage (raw bytes)
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Hugging Face API setup
const HF_API_URL = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224";
const HF_TOKEN = "Bearer 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"; // keep Bearer

// ================================
// ✅ Route 1: AI Auto Tagging via Image URL
// ================================
router.post("/auto-tag", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Step 1: Fetch image as binary data
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Step 2: Send image bytes to Hugging Face
    const response = await axios.post(HF_API_URL, imageResponse.data, {
      headers: {
        Authorization: HF_TOKEN,
        "Content-Type": "application/octet-stream",
      },
    });

    // Step 3: Extract predicted class labels
    const tags = response.data.map((item) => item.label);

    res.json({ tags });
  } catch (error) {
    console.error("AI tagging error:", error.response?.data || error.message);
    res.status(500).json({ error: "AI tagging failed" });
  }
});

// ================================
// ✅ Route 2: AI Auto Tagging via Raw Image Upload (FormData)
// ================================
router.post("/auto-tag-2", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    console.log("auto-tag-2 API triggered for file:", file.originalname);

    // Step 1: Send raw bytes to Hugging Face
    const response = await axios.post(HF_API_URL, file.buffer, {
      headers: {
        Authorization: HF_TOKEN,
        "Content-Type": "application/octet-stream",
      },
    });

    // Step 2: Extract predicted class labels
    const tags = response.data.map((item) => item.label);

    res.json({ tags });
  } catch (error) {
    console.error("AI tagging error:", error.response?.data || error.message);
    res.status(500).json({ error: "AI tagging failed" });
  }
});

export default router;
