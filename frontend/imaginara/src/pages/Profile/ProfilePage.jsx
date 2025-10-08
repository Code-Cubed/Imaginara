import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Trash2, Heart, MessageCircle, Eye, Edit, X } from "lucide-react";
import { io } from "socket.io-client";
import LeftBar from "../../components/leftBar/LeftBar";
import "./ProfilePage.css";

const ProfilePage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("uploads");
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');

  // Get userId from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (err) {
      return null;
    }
  };

  const userId = getUserIdFromToken();

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // Initialize socket connection
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);

    // Join user's personal room
    newSocket.emit("join-user", userId);

    // Listen for real-time updates
    newSocket.on("artwork-uploaded", (data) => {
      if (data.userId === userId) {
        fetchUploads();
      }
    });

    newSocket.on("bookmark-updated", (data) => {
      if (data.userId === userId) {
        fetchBookmarks();
      }
    });

    return () => {
      newSocket.emit("leave-user", userId);
      newSocket.close();
    };
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchUploads();
      fetchBookmarks();
      fetchLikes();
      fetchComments();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/profile`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch profile");
      setProfile(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/users/${userId}/uploads`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch uploads");
      setUploads(data.artworks || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/users/${userId}/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch bookmarks");
      setBookmarks(data.artworks || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/users/${userId}/likes`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch likes");
      setLikes(data.artworks || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/users/${userId}/comments`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch comments");
      setComments(data.comments || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
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
        c._id === commentId ? { ...c, text: updatedComment.text } : c
      ));

      cancelEdit();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
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
      alert('Comment deleted successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and ALL associated data including artworks, comments, and bookmarks. This action cannot be undone. Are you sure?"
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm("Are you ABSOLUTELY sure? Type DELETE to confirm.");
    if (!doubleConfirm) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/users/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to delete account");

      alert("Account deleted successfully");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArtworkClick = (artworkId) => {
    navigate(`/artwork/${artworkId}`);
  };

  const handleRemoveBookmark = async (artworkId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/artworks/${artworkId}/bookmark`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to remove bookmark");

      // Remove from local state
      setBookmarks(bookmarks.filter((b) => b._id !== artworkId));
    } catch (err) {
      alert(err.message);
    }
  };

  const renderArtworkCard = (artwork, showRemoveBookmark = false) => (
    <div
      key={artwork._id}
      className="artwork-card"
      onClick={() => handleArtworkClick(artwork._id)}
    >
      <div className="artwork-image-container">
        {artwork.mediaType === "image" ? (
          <img
            src={artwork.thumbnailUrl || artwork.mediaUrl}
            alt={artwork.title}
            className="artwork-image"
          />
        ) : artwork.mediaType === "video" ? (
          <video src={artwork.mediaUrl} className="artwork-image" muted />
        ) : (
          <div className="artwork-placeholder">
            <span className="media-icon">
              {artwork.mediaType === "audio" ? "🎵" : "📄"}
            </span>
          </div>
        )}
        <div className="artwork-overlay">
          <div className="artwork-stats">
            <span>
              <Heart size={16} /> {artwork.likes?.length || 0}
            </span>
            <span>
              <Eye size={16} /> {artwork.views || 0}
            </span>
            <span>
              <MessageCircle size={16} /> {artwork.commentsCount || 0}
            </span>
          </div>
        </div>
      </div>
      <div className="artwork-info">
        <h3 className="artwork-title">{artwork.title}</h3>
        {artwork.creator && (
          <p className="artwork-creator">By {artwork.creator.name}</p>
        )}
        {artwork.category && (
          <span className="artwork-category">{artwork.category}</span>
        )}
        {showRemoveBookmark && (
          <button
            onClick={(e) => handleRemoveBookmark(artwork._id, e)}
            className="remove-bookmark-btn"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (error) {
      return <div className="alert alert-error">{error}</div>;
    }

    switch (activeTab) {
      case "uploads":
        return uploads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h3>No uploads yet</h3>
            <p>Share your creative work with the community!</p>
            <button
              onClick={() => navigate("/addartwork")}
              className="btn btn-primary"
            >
              Upload Artwork
            </button>
          </div>
        ) : (
          <div className="artworks-grid">
            {uploads.map((artwork) => renderArtworkCard(artwork))}
          </div>
        );

      case "bookmarks":
        return bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Save artworks you love to view them later!</p>
          </div>
        ) : (
          <div className="artworks-grid">
            {bookmarks.map((artwork) => renderArtworkCard(artwork, true))}
          </div>
        );

      case "likes":
        return likes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">❤️</div>
            <h3>No likes yet</h3>
            <p>Like artworks to show your appreciation!</p>
          </div>
        ) : (
          <div className="artworks-grid">
            {likes.map((artwork) => renderArtworkCard(artwork))}
          </div>
        );

      case "comments":
        return comments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No comments yet</h3>
            <p>Start engaging with the community!</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => {
              const isEditing = editingCommentId === comment._id;

              return (
                <div
                  key={comment._id}
                  className="comment-card"
                  onClick={!isEditing ? () => handleArtworkClick(comment.artwork._id) : undefined}
                  style={{ cursor: !isEditing ? 'pointer' : 'default' }}
                >
                  <div className="comment-artwork-thumb">
                    {comment.artwork?.thumbnailUrl && (
                      <img
                        src={comment.artwork.thumbnailUrl}
                        alt={comment.artwork.title}
                      />
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header-row">
                      <p className="comment-meta">
                        On: <strong>{comment.artwork?.title || "Unknown"}</strong>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </p>

                      {!isEditing && (
                        <div className="comment-actions">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(comment); }}
                            className="action-btn edit-btn"
                            title="Edit Comment"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment._id); }}
                            className="action-btn delete-btn"
                            title="Delete Comment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="edit-form" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                          className="comment-edit-input"
                          rows={3}
                        />
                        <div className="edit-actions-footer">
                          <button
                            onClick={() => handleEditComment(comment._id)}
                            className="btn btn-primary btn-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn btn-secondary btn-sm"
                          >
                            <X size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text">{comment.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <LeftBar onLogout={onLogout} />
        <div className="flex-1 p-6">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftBar onLogout={onLogout} />

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.user?.avatar ? (
                <img src={profile.user.avatar} alt={profile.user.name} />
              ) : (
                <User size={48} />
              )}
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{profile.user?.name || "User"}</h1>
              <p className="profile-email">{profile.user?.email}</p>
              {profile.user?.bio && <p className="profile-bio">{profile.user.bio}</p>}

              {/* Stats */}
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{profile.stats?.uploads || 0}</span>
                  <span className="stat-label">Uploads</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.stats?.followers || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{profile.stats?.following || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === "uploads" ? "active" : ""}`}
              onClick={() => setActiveTab("uploads")}
            >
              Uploads ({uploads.length})
            </button>
            <button
              className={`tab ${activeTab === "bookmarks" ? "active" : ""}`}
              onClick={() => setActiveTab("bookmarks")}
            >
              Bookmarks ({bookmarks.length})
            </button>
            <button
              className={`tab ${activeTab === "likes" ? "active" : ""}`}
              onClick={() => setActiveTab("likes")}
            >
              Likes ({likes.length})
            </button>
            <button
              className={`tab ${activeTab === "comments" ? "active" : ""}`}
              onClick={() => setActiveTab("comments")}
            >
              Comments ({comments.length})
            </button>
          </div>

          {/* Content */}
          <div className="profile-content">{renderContent()}</div>

          {/* Danger Zone */}
          <div className="danger-zone">
            <h3 className="danger-title">Danger Zone</h3>
            <p className="danger-description">
              Once you delete your account, there is no going back. All your artworks,
              comments, and data will be permanently deleted.
            </p>
            <button onClick={handleDeleteAccount} className="btn-danger">
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;