import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import { Bookmark, BookmarkCheck, Trash2, Edit, X, UserPlus, UserCheck } from 'lucide-react'; 

import './ArtworkDetail.css';


const ArtworkDetail = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState(''); // New comment input
  const [socket, setSocket] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // State for comment editing
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  
  // State for follow status
  const [isFollowing, setIsFollowing] = useState(false);


  // Get current user ID from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (err) {
      return null;
    }
  };

  const currentUserId = getUserIdFromToken();
  
  // Check Follow Status function
  const checkFollowStatus = async (creatorId) => {
    // Only check if logged in and not checking self
    if (!currentUserId || !creatorId || currentUserId === creatorId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/follow/check/${creatorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error('Failed to check follow status:', err);
    }
  };

  // Handle Follow/Unfollow function
  const handleFollow = async () => {
    if (!currentUserId) {
      alert('Please login to follow artists');
      navigate('/login');
      return;
    }

    if (!artwork?.creator?._id) return; 

    if (artwork.creator._id === currentUserId) {
      alert('You cannot follow yourself');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/follow/${artwork.creator._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setIsFollowing(data.isFollowing);
      
      // Show success message
      if (data.isFollowing) {
        alert(`You are now following ${artwork.creator.name}`);
      } else {
        alert(`You unfollowed ${artwork.creator.name}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };


  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    newSocket.emit('join-artwork', id);

    // Socket listeners
    newSocket.on('new-comment', (newComment) => {
      // Only update if it's not the current user's comment (to avoid duplicates)
      if (newComment.user._id !== currentUserId) {
        setComments((prev) => [newComment, ...prev]);
        setArtwork((prev) => ({
          ...prev,
          commentsCount: prev.commentsCount + 1
        }));
      }
    });
    
    // Handle real-time comment updates
    newSocket.on('comment-updated', (updatedComment) => {
        setComments(prevComments => prevComments.map(c => 
            c._id === updatedComment._id ? updatedComment : c
        ));
    });

    // Handle real-time comment deletion
    newSocket.on('comment-deleted', ({ commentId, artworkId }) => {
        setComments(prevComments => prevComments.filter(c => c._id !== commentId));
        setArtwork(prev => prev ? { ...prev, commentsCount: prev.commentsCount - 1 } : prev);
    });

    newSocket.on('like-updated', (data) => {
      setArtwork((prev) => ({
        ...prev,
        // Assuming data.likes is the new count or array length
        likes: { length: data.likes } 
      }));
    });

    newSocket.on('view-updated', (data) => {
      setArtwork((prev) => ({
        ...prev,
        views: data.views
      }));
    });

    return () => {
      newSocket.emit('leave-artwork', id);
      newSocket.close();
    };
  }, [id, currentUserId]);

  // Initial data fetch useEffect
  useEffect(() => {
    let isMounted = true;
    
    const loadArtwork = async () => {
      if (isMounted) {
        await fetchArtwork();
        await fetchComments();
        
        if (currentUserId && localStorage.getItem('token')) {
             await fetchBookmarkStatus();
        }

        const viewedArtworks = JSON.parse(sessionStorage.getItem('viewedArtworks') || '[]');
        
        if (!viewedArtworks.includes(id)) {
          trackView();
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
  
  // useEffect to handle follow status check when artwork or creator changes
  useEffect(() => {
    // Check follow status only if artwork and its creator are loaded
    if (artwork?.creator?._id) {
        checkFollowStatus(artwork.creator._id);
    }
  }, [artwork?.creator?._id, currentUserId]); 


  const trackView = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/artworks/${id}/view`, {
        method: 'POST'
      });
      const data = await response.json();
      
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
      const response = await fetch(`http://localhost:8000/api/artworks/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch artwork');
      }

      setArtwork(data);
      
      if (currentUserId && data.likes) {
        const liked = data.likes.some(like => like.toString() === currentUserId);
        setIsLiked(liked);
      }

      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) return;

    try {
        const response = await fetch(`http://localhost:8000/api/users/${currentUserId}/bookmarks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
            const bookmarked = data.some(item => item._id === id);
            setIsBookmarked(bookmarked);
        }
    } catch (err) {
        console.error('Failed to check bookmark status:', err);
    }
  };


  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/comments/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch comments');
      }

      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      alert('Please login to like artworks');
      navigate('/login');
      return;
    }

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

      setArtwork((prev) => ({
        ...prev,
        likes: { length: data.likes }
      }));
      
      setIsLiked(!isLiked);

      if (socket) {
        socket.emit('like-updated', { artworkId: id, likes: data.likes });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBookmark = async () => {
    if (!currentUserId) {
      alert('Please login to bookmark artworks');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/artworks/${id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to bookmark artwork');
      }

      setIsBookmarked(data.bookmarked);

      if (socket) {
        socket.emit('bookmark-updated', { 
          userId: currentUserId, 
          artworkId: id, 
          bookmarked: data.bookmarked 
        });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      alert('Please login to comment');
      navigate('/login');
      return;
    }
    
    if (!comment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/comments/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: comment
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to post comment');
      }

      if (socket) {
        socket.emit('comment-added', { artworkId: id, comment: data });
      }

      setComment('');
      setComments([data, ...comments]);
      setArtwork((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount + 1
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteArtwork = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete this artwork? This action is permanent and cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/artworks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete artwork.');
      }

      alert('Artwork deleted successfully!');
      navigate('/home'); 
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  
  const startEdit = (comment) => {
      setEditingCommentId(comment._id);
      setEditedCommentText(comment.text);
  };

  const cancelEdit = () => {
      setEditingCommentId(null);
      setEditedCommentText('');
  };

  const handleEditComment = async (commentId) => {
      if (!editedCommentText.trim()) return alert('Comment cannot be empty.');

      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8000/api/comments/${commentId}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ text: editedCommentText })
          });

          const updatedComment = await response.json();

          if (!response.ok) {
              throw new Error(updatedComment.message || 'Failed to edit comment');
          }

          setComments(prev => prev.map(c => 
              c._id === commentId ? updatedComment : c
          ));

          if (socket) {
              socket.emit('comment-updated', updatedComment); 
          }

          cancelEdit();

      } catch (err) {
          alert(err.message);
      }
  };

  const handleDeleteComment = async (commentId) => {
      if (!window.confirm('Are you sure you want to delete this comment?')) return;

      try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8000/api/comments/${commentId}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!response.ok) {
              const data = await response.json();
              throw new Error(data.message || 'Failed to delete comment.');
          }

          setComments(prev => prev.filter(c => c._id !== commentId));
          setArtwork(prev => prev ? { ...prev, commentsCount: prev.commentsCount - 1 } : prev);

          if (socket) {
              socket.emit('comment-deleted', { commentId, artworkId: id });
          }

      } catch (err) {
          alert(err.message);
      }
  };


  if (loading) {
    return (
      <div className="loading-container p-6 flex-1">
        <div className="loading-spinner"></div>
        <p>Loading artwork...</p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="error-container p-6 flex-1">
        <h2>Error</h2>
        <p>{error || 'Artwork not found'}</p>
        <button onClick={() => navigate('/home')} className="btn btn-primary">
          Back to Gallery
        </button>
      </div>
    );
  }

  // Check if current user is the creator
  const isCreator = artwork && artwork.creator && artwork.creator._id === currentUserId;

  return (
    <div className="detail-page-content-wrapper flex-1 p-4 sm:p-6">
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

              {/* Conditional Delete Button near header */}
              {isCreator && (
                <button 
                  onClick={handleDeleteArtwork} 
                  className="btn btn-danger btn-sm my-2 flex items-center space-x-1" 
                >
                  <Trash2 size={16} /> <span>Delete Artwork</span>
                </button>
              )}


              {/* Creator Info and Follow Button Logic */}
              {artwork.creator && (
                currentUserId !== artwork.creator._id ? (
                  // Case 1: Viewing another artist's work -> Show Follow button
                  <div className="artwork-creator-follow">
                    <div className="creator-info-inline">
                      <div className="creator-avatar-small">
                        {artwork.creator.avatar ? (
                          <img src={artwork.creator.avatar} alt={artwork.creator.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {artwork.creator.name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <span 
                        className="creator-name-link"
                        onClick={() => navigate(`/user/${artwork.creator._id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {artwork.creator.name}
                      </span>
                    </div>
                    {/* FOLLOW BUTTON */}
                    <button
                      onClick={handleFollow}
                      className={`btn-follow-artist ${isFollowing ? 'following' : ''}`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={16} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} /> Follow
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Case 2: Viewing your own work -> Show simple creator info
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
                )
              )}
              {/* Fallback for logged-out users (no currentUserId) viewing a work */}
              {!currentUserId && artwork.creator && (
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
              )}


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
                <button 
                  onClick={handleLike} 
                  className={`btn btn-like ${isLiked ? 'liked' : ''}`}
                >
                  {isLiked ? '❤️ Liked' : '🤍 Like'}
                </button>
                <button 
                  onClick={handleBookmark} 
                  className={`btn btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck size={18} /> Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark size={18} /> Bookmark
                    </>
                  )}
                </button>
                <button className="btn btn-share">
                  🔗 Share
                </button>
              </div>

              {/* Comments Section */}
              <div className="comments-section">
                <h3>Comments ({comments.length})</h3>
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

                <div className="comments-list">
                  {comments.map((cmt) => {
                    const isCommentCreator = cmt.user?._id === currentUserId;
                    const isEditing = editingCommentId === cmt._id;

                    return (
                      <div key={cmt._id} className="comment-item">
                        <div className="comment-avatar">
                          {cmt.user?.avatar ? (
                            <img src={cmt.user.avatar} alt={cmt.user.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {cmt.user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-author">{cmt.user?.name || 'Anonymous'}</span>
                            <span className="comment-date">
                              {new Date(cmt.createdAt).toLocaleDateString()}
                            </span>

                            {/* Conditional Edit/Delete Buttons */}
                            {isCommentCreator && !isEditing && (
                              <div className="comment-actions">
                                <button onClick={() => startEdit(cmt)} className="action-btn edit-btn">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDeleteComment(cmt._id)} className="action-btn delete-btn">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Conditional Rendering for Edit Form or Comment Text */}
                          {isEditing ? (
                            <div className="edit-form">
                              <textarea
                                value={editedCommentText}
                                onChange={(e) => setEditedCommentText(e.target.value)}
                                className="comment-edit-input"
                                rows={3}
                              />
                              <div className="edit-actions-footer">
                                <button onClick={() => handleEditComment(cmt._id)} className="btn btn-primary btn-sm">
                                  Save
                                </button>
                                <button onClick={cancelEdit} className="btn btn-secondary btn-sm ml-2">
                                  <X size={16} /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="comment-text">{cmt.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ArtworkDetail;