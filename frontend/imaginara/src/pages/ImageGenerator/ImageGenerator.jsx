// pages/ImageGenerator/ImageGenerator.jsx
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../Context/ThemeContext';
import { Download, Sparkles, RefreshCw, Image as ImageIcon } from 'lucide-react';
import './ImageGenerator.css';

const ImageGenerator = () => {
  const { theme } = useContext(ThemeContext);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const examplePrompts = [
    "A mystical forest with glowing mushrooms at night",
    "Abstract painting of emotions in vibrant colors",
    "Futuristic city with flying cars and neon lights",
    "Serene mountain landscape at sunset",
    "Steampunk robot playing violin",
    "Underwater palace with colorful coral"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const response = await fetch('http://localhost:8000/api/image-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.retry) {
          setError(data.error + ' Retrying in 5 seconds...');
          setTimeout(() => handleGenerate(), 5000);
          return;
        }
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.imageUrl);
      setHistory([{ prompt, imageUrl: data.imageUrl, timestamp: new Date() }, ...history]);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseExample = (examplePrompt) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className={`image-generator-container ${theme}`} data-theme={theme}>
      <div className="image-generator-content">
        {/* Header */}
        <div className="generator-header">
          <div className="header-icon">
            <Sparkles size={40} />
          </div>
          <h1 className="header-title">AI Image Generator</h1>
          <p className="header-subtitle">
            Transform your imagination into stunning artwork with AI
          </p>
        </div>

        {/* Main Generator */}
        <div className="generator-main">
          <div className="generator-card">
            {/* Input Section */}
            <div className="input-section">
              <label className="input-label">
                <ImageIcon size={20} />
                Describe your image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a detailed description of the image you want to create..."
                className="prompt-textarea"
                rows={4}
                disabled={loading}
              />
              
              <div className="action-buttons">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="generate-btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={20} className="spinning" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Generated Image */}
            {generatedImage && (
              <div className="result-section">
                <div className="result-header">
                  <h3>Generated Image</h3>
                  <button onClick={handleDownload} className="download-btn">
                    <Download size={20} />
                    Download
                  </button>
                </div>
                <div className="image-container">
                  <img src={generatedImage} alt="Generated" className="generated-image" />
                </div>
                <div className="prompt-used">
                  <strong>Prompt:</strong> {prompt}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Creating your masterpiece...</p>
                <p className="loading-subtext">This may take 20-30 seconds</p>
              </div>
            )}
          </div>

          {/* Example Prompts */}
          <div className="examples-section">
            <h3 className="examples-title">Try these examples</h3>
            <div className="examples-grid">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleUseExample(example)}
                  className="example-card"
                  disabled={loading}
                >
                  <Sparkles size={16} />
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="history-section">
              <h3 className="history-title">Recent Generations</h3>
              <div className="history-grid">
                {history.slice(0, 6).map((item, index) => (
                  <div key={index} className="history-item">
                    <img src={item.imageUrl} alt={item.prompt} />
                    <div className="history-overlay">
                      <p>{item.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;