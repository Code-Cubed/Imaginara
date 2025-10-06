// ArtworkList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftBar from '../../components/leftBar/LeftBar';
import './ArtworkList.css';
import TopBar from '../../components/topBar/topBar';
const ArtworkList = ({ onLogout }) => {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'recent'
  });

  const categories = ['All', 'Art', 'Photography', 'Writing', 'Performance', 'Digital Art', 'Sculpture', 'Music', 'Dance', 'Other'];

  useEffect(() => {
    fetchArtworks();
  }, [filters]);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('q', filters.search);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.sort === 'popular') params.append('sort', 'popular');

      const response = await fetch(`http://localhost:8000/api/artworks?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch artworks');
      }

      setArtworks(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (category) => {
    setFilters({ ...filters, category });
  };

  const handleSortChange = (sort) => {
    setFilters({ ...filters, sort });
  };

  const handleArtworkClick = (artworkId) => {
    navigate(`/artwork/${artworkId}`);
  };

  return (
    <div className="page-container">
      <LeftBar onLogout={onLogout} />
      
      <div className="main-content">
        <TopBar />
        <div className="gallery-container">
          {/* Header */}
          <div className="gallery-header">
            <h1 className="gallery-title">Gallery of Wonders</h1>
            <p className="gallery-subtitle">Discover amazing creative works</p>
          </div>

          {/* Search and Filters */}
          <div className="filters-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search artworks..."
                value={filters.search}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="filter-buttons">
              <select
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat === 'All' ? '' : cat)}
                className={`category-tab ${(cat === 'All' && !filters.category) || filters.category === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading artworks...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎨</div>
              <h3>No artworks found</h3>
              <p>Be the first to share your creative work!</p>
              <button onClick={() => navigate('/addartwork')} className="btn btn-primary">
                Upload Artwork
              </button>
            </div>
          ) : (
            <div className="artworks-grid">
              {artworks.map((artwork) => (
                <div
                  key={artwork._id}
                  className="artwork-card"
                  onClick={() => handleArtworkClick(artwork._id)}
                >
                  <div className="artwork-image-container">
                    {artwork.mediaType === 'image' ? (
                      <img
                        src={artwork.thumbnailUrl || artwork.mediaUrl}
                        alt={artwork.title}
                        className="artwork-image"
                      />
                    ) : artwork.mediaType === 'video' ? (
                      <video
                        src={artwork.mediaUrl}
                        className="artwork-image"
                        muted
                      />
                    ) : (
                      <div className="artwork-placeholder">
                        <span className="media-icon">
                          {artwork.mediaType === 'audio' ? '🎵' : '📄'}
                        </span>
                      </div>
                    )}
                    <div className="artwork-overlay">
                      <div className="artwork-stats">
                        <span>❤️ {artwork.likes.length}</span>
                        <span>👁️ {artwork.views}</span>
                      </div>
                    </div>
                  </div>
                  <div className="artwork-info">
                    <h3 className="artwork-title">{artwork.title}</h3>
                    <p className="artwork-creator">
                      By {artwork.creator?.name || 'Unknown'}
                    </p>
                    {artwork.category && (
                      <span className="artwork-category">{artwork.category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworkList;