// utils/similarityService.js
const axios = require('axios');
const natural = require('natural');
const TfIdf = natural.TfIdf;

// OpenAI API for embeddings (you'll need to set OPENAI_API_KEY in .env)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
};

// Generate text embedding using OpenAI
const generateTextEmbedding = async (text) => {
  try {
    if (!OPENAI_API_KEY) {
      // Fallback: Use simple TF-IDF if OpenAI key not available
      return generateSimpleEmbedding(text);
    }

    const response = await axios.post(
      OPENAI_EMBEDDINGS_URL,
      {
        input: text,
        model: 'text-embedding-ada-002'
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error.message);
    // Fallback to simple embedding
    return generateSimpleEmbedding(text);
  }
};

// Fallback: Simple embedding using TF-IDF (when OpenAI not available)
const generateSimpleEmbedding = (text) => {
  const tfidf = new TfIdf();
  tfidf.addDocument(text.toLowerCase());
  
  const terms = {};
  tfidf.listTerms(0).forEach(item => {
    terms[item.term] = item.tfidf;
  });
  
  // Convert to fixed-size vector (128 dimensions)
  const vectorSize = 128;
  const vector = new Array(vectorSize).fill(0);
  
  Object.keys(terms).forEach((term, index) => {
    const hash = term.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const position = Math.abs(hash) % vectorSize;
    vector[position] += terms[term];
  });
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
};

// Generate image embedding using OpenAI Vision or Cloudinary AI
const generateImageEmbedding = async (imageUrl) => {
  try {
    // Option 1: Use OpenAI Vision API (if available)
    if (OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Describe this image in detail, focusing on: style, colors, subject matter, composition, mood, and artistic technique. Be concise but comprehensive.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const description = response.data.choices[0].message.content;
      return await generateTextEmbedding(description);
    }
    
    // Fallback: Extract features from URL or metadata
    return generateSimpleImageEmbedding(imageUrl);
  } catch (error) {
    console.error('Image embedding error:', error.message);
    return generateSimpleImageEmbedding(imageUrl);
  }
};

// Fallback: Simple image embedding based on URL patterns
const generateSimpleImageEmbedding = (imageUrl) => {
  // Extract features from filename and create a simple hash-based vector
  const features = imageUrl.split('/').pop().toLowerCase();
  return generateSimpleEmbedding(features);
};

// Calculate similarity score between artworks
const calculateArtworkSimilarity = (artwork1, artwork2) => {
  let totalSimilarity = 0;
  let weights = 0;

  // Text similarity (title + description + tags)
  if (artwork1.textEmbedding && artwork2.textEmbedding) {
    const textSim = cosineSimilarity(artwork1.textEmbedding, artwork2.textEmbedding);
    totalSimilarity += textSim * 0.4; // 40% weight
    weights += 0.4;
  }

  // Image similarity
  if (artwork1.imageEmbedding && artwork2.imageEmbedding) {
    const imageSim = cosineSimilarity(artwork1.imageEmbedding, artwork2.imageEmbedding);
    totalSimilarity += imageSim * 0.4; // 40% weight
    weights += 0.4;
  }

  // Category match
  if (artwork1.category && artwork2.category) {
    const categorySim = artwork1.category === artwork2.category ? 1 : 0;
    totalSimilarity += categorySim * 0.1; // 10% weight
    weights += 0.1;
  }

  // Tag overlap
  if (artwork1.tags && artwork2.tags && artwork1.tags.length > 0 && artwork2.tags.length > 0) {
    const tags1 = new Set(artwork1.tags.map(t => t.toLowerCase()));
    const tags2 = new Set(artwork2.tags.map(t => t.toLowerCase()));
    const intersection = new Set([...tags1].filter(x => tags2.has(x)));
    const union = new Set([...tags1, ...tags2]);
    const tagSim = intersection.size / union.size;
    totalSimilarity += tagSim * 0.1; // 10% weight
    weights += 0.1;
  }

  return weights > 0 ? totalSimilarity / weights : 0;
};

// Generate combined text for embedding
const generateArtworkText = (artwork) => {
  const parts = [
    artwork.title || '',
    artwork.description || '',
    artwork.category || '',
    ...(artwork.tags || [])
  ];
  return parts.filter(p => p).join(' ');
};

module.exports = {
  generateTextEmbedding,
  generateImageEmbedding,
  cosineSimilarity,
  calculateArtworkSimilarity,
  generateArtworkText,
  generateSimpleEmbedding
};