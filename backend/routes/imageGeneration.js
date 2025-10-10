
const express = require('express');
const router = express.Router();
const axios = require('axios');


// const MODEL_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"; // FASTEST
const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"; // BEST QUALITY


console.log('🔧 Image Generation Route Loading...');
console.log('📍 Model URL:', MODEL_URL);

// Get API key
const HF_IMAGE_KEY = process.env.HF_IMAGE_GEN_KEY || process.env.HF_API_KEY;

if (!HF_IMAGE_KEY) {
  console.error('❌ ERROR: HF_IMAGE_KEY not found in environment variables!');
  console.error('💡 Add to .env: HF_IMAGE_GEN_KEY=your_key_here');
} else {
  console.log('✅ API Key found:', HF_IMAGE_KEY.substring(0, 10) + '...');
}

// Generate image from text prompt
router.post('/generate', async (req, res) => {
  console.log('\n🎨 ========== NEW IMAGE GENERATION REQUEST ==========');
  console.log('📥 Request body:', req.body);

  try {
    const { prompt } = req.body;

    // ✅ Validate prompt
    if (!prompt || prompt.trim() === '') {
      console.log('❌ Validation failed: No prompt provided');
      return res.status(400).json({
        error: 'Prompt is required',
        received: req.body,
      });
    }

    console.log('📝 Prompt:', prompt);
    console.log('🔑 Using API key:', HF_IMAGE_KEY ? 'Yes' : 'No');
    console.log('🌐 Model URL:', MODEL_URL);
    console.log('⏳ Sending request to Hugging Face...');

    // ✅ Correct Hugging Face API request
    const response = await axios.post(
      MODEL_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_IMAGE_KEY}`,
          Accept: 'image/png', // ✅ crucial fix!
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // ✅ get raw binary image data
        timeout: 120000, // 2 minutes
        validateStatus: (status) => status < 600, // don't throw on non-200
      }
    );

    console.log('📊 Response status:', response.status);

    // Handle known Hugging Face responses
    if (response.status === 503) {
      console.log('⚠️ Model is loading (503)');
      return res.status(503).json({
        error: 'Model is loading',
        message: 'Please wait 20–30 seconds and try again.',
        retry: true,
        status: 503,
      });
    }

    if (response.status === 429) {
      console.log('⚠️ Rate limit exceeded (429)');
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment.',
        status: 429,
      });
    }

    if (response.status === 401 || response.status === 403) {
      console.log('❌ Invalid API key');
      const errorText = Buffer.from(response.data).toString();
      console.log('Error details:', errorText);
      return res.status(response.status).json({
        error: 'Invalid API key',
        message: 'Check your Hugging Face API key in .env file',
        details: errorText,
      });
    }

    if (response.status !== 200) {
      console.log('❌ Unexpected status:', response.status);
      const errorText = Buffer.from(response.data).toString();
      console.log('Error details:', errorText);
      return res.status(response.status).json({
        error: 'Image generation failed',
        message: errorText,
        status: response.status,
      });
    }

    // ✅ Success – convert binary image to Base64
    console.log('✅ Image received! Converting to base64...');
    const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    console.log('✅ Image generated successfully!');
    console.log('📏 Image size:', imageBase64.length, 'bytes');
    console.log('🎉 ========== REQUEST COMPLETED ==========\n');

    res.json({
      success: true,
      imageUrl,
      prompt,
      model: MODEL_URL.split('/').pop(),
    });
  } catch (error) {
    console.error('\n❌ ========== ERROR OCCURRED ==========');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      try {
        const errorText = Buffer.from(error.response.data).toString();
        console.error('Error details:', errorText);
      } catch (e) {
        console.error('Could not parse error data');
      }
    }

    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout');
    }

    console.error('Stack trace:', error.stack);
    console.error('🛑 ========== ERROR END ==========\n');

    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
      type: error.name,
      code: error.code,
      responseStatus: error.response?.status,
      hint: 'Check backend console for detailed logs',
    });
  }
});


// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    success: true,
    message: 'Image generation route is working!',
    model: MODEL_URL,
    apiKeyPresent: !!HF_IMAGE_KEY,
    apiKeyPrefix: HF_IMAGE_KEY ? HF_IMAGE_KEY.substring(0, 10) + '...' : 'NOT SET'
  });
});

// Get models endpoint
router.get('/models', (req, res) => {
  res.json({
    success: true,
    current: MODEL_URL,
    available: [
      {
        id: 'sd15',
        name: 'Stable Diffusion v1.5',
        url: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
        speed: 'Fast',
        quality: 'Good'
      },
      {
        id: 'sdxl',
        name: 'Stable Diffusion XL',
        url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        speed: 'Slow',
        quality: 'Excellent'
      },
      {
        id: 'realistic',
        name: 'Realistic Vision',
        url: 'https://api-inference.huggingface.co/models/SG161222/Realistic_Vision_V2.0',
        speed: 'Medium',
        quality: 'Very Good'
      }
    ]
  });
});



module.exports = router;