// ArtworkDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import LeftBar from '../../components/leftBar/LeftBar';
import './ArtworkDetail.css';

const ArtworkDetail = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    // Join artwork room
    newSocket.emit('join-artwork', id);

    // Listen for real-time updates
    newSocket.on('new-comment', () => {
      setArtwork((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount + 1
      }));
    });

    newSocket.on('like-updated', (data) => {
      setArtwork((prev) => ({
        ...prev,
        likes: { length: data.likes }
      }));
    });

    // Listen for view updates
    newSocket.on('view-updated', (data) => {
      setArtwork((prev) => ({
        ...prev,
        views: data.views
      }));
    });

    // Cleanup
    return () => {
      newSocket.emit('leave-artwork', id);
      newSocket.close();
    };
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    
    const loadArtwork = async () => {
      if (isMounted) {
        await fetchArtwork();
        
        // Check if this artwork has been viewed in this session
        const viewedArtworks = JSON.parse(sessionStorage.getItem('viewedArtworks') || '[]');
        
        if (!viewedArtworks.includes(id)) {
          // Track view only if not viewed in this session
          trackView();
          // Mark as viewed in this session
          viewedArtworks.push(id);
          sessionStorage.setItem('viewedArtworks', JSON.stringify(viewedArtworks));
        }
      }
    };
    
    loadArtwork();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  const trackView = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/artworks/${id}/view`, {
        method: 'POST'
      });
      const data = await response.json();
      
      // Update the artwork state with new view count
      if (response.ok && data.views) {
        setArtwork(prev => prev ? { ...prev, views: data.views } : prev);
      }
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  };

  const fetchArtwork = async () => {
    try {
      setLoading(true);
      // Don't increment view when fetching - we'll do it separately
      const response = await fetch(`http://localhost:8000/api/artworks/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch artwork');
      }

      setArtwork(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/artworks/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to like artwork');
      }

      // Update local state
      setArtwork((prev) => ({
        ...prev,
        likes: { length: data.likes }
      }));

      // Emit socket event
      if (socket) {
        socket.emit('like-updated', { artworkId: id, likes: data.likes });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          artworkId: id,
          text: comment
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post comment');
      }

      // Emit socket event
      if (socket) {
        socket.emit('comment-added', { artworkId: id, comment: data });
      }

      setComment('');
      setArtwork((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount + 1
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LeftBar onLogout={onLogout} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading artwork...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="page-container">
        <LeftBar onLogout={onLogout} />
        <div className="main-content">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Artwork not found'}</p>
            <button onClick={() => navigate('/home')} className="btn btn-primary">
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <LeftBar onLogout={onLogout} />
      
      <div className="main-content">
        <div className="detail-container">
          <button onClick={() => navigate('/home')} className="back-button">
            ← Back to Gallery
          </button>

          <div className="artwork-detail">
            {/* Media Section */}
            <div className="media-section">
              {artwork.mediaType === 'image' && (
                <img
                  src={artwork.mediaUrl}
                  alt={artwork.title}
                  className="detail-media"
                />
              )}
              {artwork.mediaType === 'video' && (
                <video
                  src={artwork.mediaUrl}
                  controls
                  className="detail-media"
                />
              )}
              {artwork.mediaType === 'audio' && (
                <div className="audio-player">
                  <div className="audio-icon">🎵</div>
                  <audio src={artwork.mediaUrl} controls className="audio-controls" />
                </div>
              )}
              {artwork.mediaType === 'document' && (
                <div className="document-viewer">
                  <div className="document-icon">📄</div>
                  <p>{artwork.title}</p>
                  <a href={artwork.mediaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Open Document
                  </a>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="info-section">
              <div className="artwork-header">
                <h1 className="detail-title">{artwork.title}</h1>
                {artwork.category && (
                  <span className="detail-category">{artwork.category}</span>
                )}
              </div>

              <div className="creator-info">
                <div className="creator-avatar">
                  {artwork.creator?.avatar ? (
                    <img src={artwork.creator.avatar} alt={artwork.creator.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {artwork.creator?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="creator-name">{artwork.creator?.name || 'Unknown Artist'}</p>
                  <p className="upload-date">
                    {new Date(artwork.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {artwork.description && (
                <div className="description-section">
                  <h3>Description</h3>
                  <p>{artwork.description}</p>
                </div>
              )}

              {artwork.tags && artwork.tags.length > 0 && (
                <div className="tags-section">
                  <h3>Tags</h3>
                  <div className="tags-list">
                    {artwork.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="stats-section">
                <div className="stat">
                  <span className="stat-icon">👁️</span>
                  <span className="stat-value">{artwork.views}</span>
                  <span className="stat-label">Views</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-value">{artwork.likes.length}</span>
                  <span className="stat-label">Likes</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">💬</span>
                  <span className="stat-value">{artwork.commentsCount}</span>
                  <span className="stat-label">Comments</span>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={handleLike} className="btn btn-like">
                  ❤️ Like
                </button>
                <button className="btn btn-share">
                  🔗 Share
                </button>
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3>Comments</h3>
                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                    rows={3}
                  />
                  <button type="submit" className="btn btn-primary">
                    Post Comment
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;