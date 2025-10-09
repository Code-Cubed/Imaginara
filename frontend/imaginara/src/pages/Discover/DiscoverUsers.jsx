import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserPlus, UserCheck, Search } from 'lucide-react';
import './DiscoverUsers.css';

const DiscoverUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

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
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8000/api/users/discover', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Filter search if searchQuery exists
      let filteredUsers = data.users || [];
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }

      setUsers(filteredUsers);

      // Follow status map
      const statusMap = {};
      for (const user of filteredUsers) {
        statusMap[user._id] = user.isFollowing || false;
      }
      setFollowingMap(statusMap);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/follow/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setFollowingMap(prev => ({
        ...prev,
        [userId]: data.isFollowing
      }));

      setUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, followersCount: data.followersCount } : user
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  if (loading) {
    return (
      <div className="discover-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h1>Discover Artists</h1>
        <p>Find and follow talented creators</p>
      </div>

      {/* Modern Search Bar */}
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          fetchSuggestedUsers();
        }}
      >
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {/* Users Grid */}
      <div className="users-grid">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search query</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="user-card">
              <div
                className="user-card-content"
                onClick={() => handleUserClick(user._id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="user-card-avatar">
                  {user.avatar ? <img src={user.avatar} alt={user.name} /> : <User size={40} />}
                </div>
                <div className="user-card-info">
                  <h3>{user.name}</h3>
                  <p className="user-email">{user.email}</p>
                  {user.bio && <p className="user-bio">{user.bio}</p>}
                  <div className="user-stats">
                    <span>{user.followersCount || 0} followers</span>
                    <span>•</span>
                    <span>{user.uploadsCount || 0} artworks</span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollowToggle(user._id);
                }}
                className={`btn btn-follow ${
                  followingMap[user._id] ? 'btn-following' : 'btn-follow-new'
                }`}
              >
                {followingMap[user._id] ? (
                  <>
                    <UserCheck size={18} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Follow
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscoverUsers;
