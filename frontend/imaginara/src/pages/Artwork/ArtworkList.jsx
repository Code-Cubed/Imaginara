import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftBar from '../../components/leftBar/LeftBar';
import TopBar from '../../components/topBar/topBar';
import './ArtworkList.css';
import { ThemeContext } from '../../Context/ThemeContext';

const ArtworkList = ({ onLogout }) => {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'recent',
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

      if (!response.ok) throw new Error(data.message || 'Failed to fetch artworks');
      setArtworks(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => setFilters({ ...filters, search: e.target.value });
  const handleCategoryChange = (category) => setFilters({ ...filters, category });
  const handleSortChange = (sort) => setFilters({ ...filters, sort });
  const handleArtworkClick = (artworkId) => navigate(`/artwork/${artworkId}`);

  const {theme} = useContext(ThemeContext);
  const textColor = theme === "dark" ? "#f3f4f6" : "#22223b";
  return (
    <div data-theme={theme} className=" flex min-h-screen ">
      {/* <LeftBar onLogout={onLogout} /> */}

      <div className="flex-1 flex flex-col">
        {/* TopBar is placed here */}
        <TopBar />

        <div className="gallery-container p-4 sm:p-6 flex-1 overflow-auto">
          
          <div className="gallery-header text-center mb-6 sm:mb-8">
            <h1 className="gallery-title">Gallery of Wonders</h1>
            <p className="gallery-subtitle">Discover amazing creative works</p>
          </div>

          
          <div className="filters-section flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search artworks..."
              value={filters.search}
              onChange={handleSearch}
              className="search-input flex-1 min-w-[200px]"
            />

            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          
          <div className="category-tabs mb-6 overflow-x-auto">
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

          
          {error && <div className="alert alert-error mb-4">{error}</div>}

          
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
                <div key={artwork._id} className="artwork-card" onClick={() => handleArtworkClick(artwork._id)}>
                  <div className="artwork-image-container">
                const { theme } = useContext(ThemeContext);
                const textColor = theme === "dark" ? "#f3f4f6" : "#22223b";
                    {artwork.mediaType === 'image' ? (
                      <div data-theme={theme} className=" flex min-h-screen " style={{ color: textColor }}>
                        <img src={artwork.thumbnailUrl || artwork.mediaUrl} alt={artwork.title} className="artwork-image" />
                        <video src={artwork.mediaUrl} className="artwork-image" muted />
                      </div>
                    ) : (
                      <div className="artwork-placeholder">
                        <span className="media-icon">{artwork.mediaType === 'audio' ? '🎵' : '📄'}</span>
                      </div>
                    )}
                    <div className="artwork-overlay">
                      <div className="artwork-stats">
                        <span> {artwork.likes.length}</span>
                        <span>  {artwork.views}</span>
                      </div>
                    </div>
                  </div>
                  <div className="artwork-info">
                    <h3 className="artwork-title">{artwork.title}</h3>
                    <p className="artwork-creator">By {artwork.creator?.name || 'Unknown'}</p>
                    {artwork.category && <span className="artwork-category">{artwork.category}</span>}
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