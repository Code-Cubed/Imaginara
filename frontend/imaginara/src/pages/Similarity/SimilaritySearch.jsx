import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Image as ImageIcon, Sparkles, X, Share2, Check } from 'lucide-react';
import './SimilaritySearch.css';

const SimilaritySearch = () => {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState('text');
  const [textQuery, setTextQuery] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null); // for share feedback

  const handleTextSearch = async (e) => {
    e.preventDefault();
    if (!textQuery.trim()) return setError('Please enter a search query');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/similarity/search/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textQuery, limit: 12 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please select an image file');
    if (file.size > 10 * 1024 * 1024) return setError('Image size must be less than 10MB');

    setImageFile(file);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageSearch = async () => {
    if (!imageFile) return setError('Please upload an image');
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('title', 'Temp Search Image');
      formData.append('category', 'Search');
      formData.append('mediaType', 'image');

      const token = localStorage.getItem('token');
      const uploadRes = await fetch('http://localhost:8000/api/artworks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error('Failed to upload search image');

      const searchRes = await fetch('http://localhost:8000/api/similarity/search/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadData.mediaUrl, limit: 12 }),
      });

      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.message || 'Search failed');

      setResults(searchData.results || []);

      await fetch(`http://localhost:8000/api/artworks/${uploadData._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearImageSearch = () => {
    setImageFile(null);
    setImagePreview(null);
    setResults([]);
  };

  const handleArtworkClick = (artworkId) => navigate(`/artwork/${artworkId}`);

  // Copy artwork link to clipboard
  const handleShare = async (artworkId) => {
    const url = `${window.location.origin}/artwork/${artworkId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(artworkId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert('Failed to copy link');
    }
  };

  return (
    <div className="page-container">
      <div className="main-content">
        <div className="similarity-container">
          <div className="similarity-header">
            <div className="header-content">
              <Sparkles size={32} color="#667eea" />
              <div>
                <h1 className="similarity-title">AI Similarity Search</h1>
                <p className="similarity-subtitle">
                  Find visually and thematically similar artworks using AI
                </p>
              </div>
            </div>
          </div>

          {/* Search Mode Toggle */}
          <div className="search-mode-toggle">
            <button
              className={`mode-btn ${searchMode === 'text' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('text');
                setResults([]);
                setError('');
              }}
            >
              <Search size={20} />
              Text Search
            </button>
            <button
              className={`mode-btn ${searchMode === 'image' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('image');
                setResults([]);
                setError('');
              }}
            >
              <ImageIcon size={20} />
              Image Search
            </button>
          </div>

          {/* Search Form */}
          {searchMode === 'text' ? (
            <form onSubmit={handleTextSearch} className="search-form">
              <div className="search-input-container">
                <Search size={10} className="search-icon" />
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Describe the artwork you're looking for..."
                  className="search-input"
                />
                {textQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTextQuery('');
                      setResults([]);
                    }}
                    className="clear-btn"
                  >
                    <X size={3} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          ) : (
            <div className="image-search-container">
              {!imagePreview ? (
                <label className="image-upload-area">
                  <ImageIcon size={48} color="#9ca3af" />
                  <p className="upload-text">Click to upload an image</p>
                  <p className="upload-subtext">Find similar artworks based on visual features</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
                </label>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Search" className="image-preview" />
                  <button onClick={clearImageSearch} className="remove-image-btn">
                    <X size={18} />
                  </button>
                  <button
                    onClick={handleImageSearch}
                    className="btn btn-primary search-image-btn"
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Find Similar'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Results */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Finding similar artworks...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="results-section">
              <div className="results-header">
                <h2>Similar Artworks ({results.length})</h2>
                <p className="results-description">
                  Sorted by similarity score (higher is more similar)
                </p>
              </div>
              <div className="artworks-grid">
                {results.map((art) => (
                  <div key={art._id} className="artwork-card">
                    <div className="similarity-badge">{art.similarityScore}% match</div>

                    <div
                      className="artwork-image-container"
                      onClick={() => handleArtworkClick(art._id)}
                    >
                      {art.mediaType === 'image' ? (
                        <img
                          src={art.thumbnailUrl || art.mediaUrl}
                          alt={art.title}
                          className="artwork-image"
                        />
                      ) : (
                        <div className="artwork-placeholder">
                          {art.mediaType === 'audio' ? '🎵' : '📄'}
                        </div>
                      )}
                    </div>

                    <div className="artwork-info">
                      <h3 className="artwork-title">{art.title}</h3>
                      {art.creator && <p className="artwork-creator">By {art.creator.name}</p>}
                      {art.category && <span className="artwork-category">{art.category}</span>}
                    </div>

                    {/* ✅ Share Button */}
                    <button
                      onClick={() => handleShare(art._id)}
                      className="btn-share"
                      title="Copy artwork link"
                    >
                      {copiedId === art._id ? (
                        <Check size={18} color="#22c55e" />
                      ) : (
                        <Share2 size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="empty-state">
                <Sparkles size={64} color="#9ca3af" />
                <h3>No results yet</h3>
                <p>
                  {searchMode === 'text'
                    ? 'Enter a description to find similar artworks'
                    : 'Upload an image to find visually similar artworks'}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SimilaritySearch;
