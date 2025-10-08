import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, UserPlus, UserCheck, Heart, MessageCircle, Eye } from "lucide-react";
import FollowersModal from "../Followers/FollowersModal";
import "./ProfilePage.css";

const PublicProfilePage = () => {
  const { userId: profileUserId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [modalType, setModalType] = useState('followers');

  // Get current user's ID
  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    // Redirect to own profile if viewing self
    if (currentUserId && profileUserId === currentUserId) {
      navigate('/profile');
      return;
    }

    fetchProfile();
    fetchUploads();
    checkFollowStatus();
  }, [profileUserId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${profileUserId}/profile`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/users/${profileUserId}/uploads`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUploads(data.artworks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/follow/check/${profileUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/follow/${profileUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setIsFollowing(data.isFollowing);
      
      // Update follower count
      setProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers: data.followersCount
        }
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const openFollowersModal = (type) => {
    setModalType(type);
    setShowFollowersModal(true);
  };

  const handleArtworkClick = (artworkId) => {
    navigate(`/artwork/${artworkId}`);
  };

  const renderArtworkCard = (artwork) => (
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
        {artwork.category && (
          <span className="artwork-category">{artwork.category}</span>
        )}
      </div>
    </div>
  );

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-100">
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
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">{profile.user?.name}</h1>
                {currentUserId && (
                  <button
                    onClick={handleFollowToggle}
                    className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={18} /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} /> Follow
                      </>
                    )}
                  </button>
                )}
              </div>

              {profile.user?.bio && (
                <p className="text-gray-600 mt-2">{profile.user.bio}</p>
              )}

              {/* Stats */}
              <div className="profile-stats mt-4">
                <div className="stat-item">
                  <span className="stat-value">{profile.stats?.uploads || 0}</span>
                  <span className="stat-label">Uploads</span>
                </div>
                <div 
                  className="stat-item stat-clickable" 
                  onClick={() => openFollowersModal('followers')}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="stat-value">{profile.stats?.followers || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div 
                  className="stat-item stat-clickable" 
                  onClick={() => openFollowersModal('following')}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="stat-value">{profile.stats?.following || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
            </div>
          </div>

          {/* Uploads Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Artworks</h2>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading artworks...</p>
              </div>
            ) : uploads.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎨</div>
                <h3>No uploads yet</h3>
                <p>This user hasn't shared any artworks.</p>
              </div>
            ) : (
              <div className="artworks-grid">
                {uploads.map((artwork) => renderArtworkCard(artwork))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={profileUserId}
        type={modalType}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default PublicProfilePage;