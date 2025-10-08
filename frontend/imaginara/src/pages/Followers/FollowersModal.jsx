import React, { useState, useEffect } from 'react';
import { X, User, UserCheck, UserPlus, Trash2 } from 'lucide-react'; // Import Trash2 for the Remove button
import './FollowersModal.css';

// Added onUpdateCounts to the props list
const FollowersModal = ({ isOpen, onClose, userId, type, currentUserId, onUpdateCounts }) => { 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'followers' 
        ? `http://localhost:8000/api/follow/${userId}/followers`
        : `http://localhost:8000/api/follow/${userId}/following`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      // The backend response structure for 'followers' and 'following' might be different.
      // If the backend returns an array directly, use `data`. If it returns { followers: [], ...}, use data[type].
      // Assuming it returns an object with keys 'followers' or 'following' containing the array:
      const userList = data[type] || [];
      setUsers(userList);
      
      // Check follow status for each user if viewing someone else's list OR if viewing your own FOLLOWING list
      // We check the status for every user *unless* the list is the user's own 'followers' list, 
      // where we know all listed users are followers.
      const shouldCheckStatus = currentUserId && (currentUserId !== userId || type === 'following');
      
      if (shouldCheckStatus) {
        const token = localStorage.getItem('token');
        const statusPromises = userList.map(async (user) => {
          // If viewing your own 'following' list, you are already following them, 
          // but we check in case the API call failed to distinguish status easily later.
          // For other users' lists, we check if current user follows them.
          const res = await fetch(`http://localhost:8000/api/follow/check/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const statusData = await res.json();
          return { userId: user._id, isFollowing: statusData.isFollowing };
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(s => statusMap[s.userId] = s.isFollowing);
        setFollowingMap(statusMap);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setLoading(false);
    }
  };

  // Helper function to handle unfollowing (same logic as follow toggle)
  const handleUnfollow = async (targetUserId) => {
    try {
      const token = localStorage.getItem('token');
      // POST to the follow endpoint acts as a toggle (follow/unfollow)
      const response = await fetch(`http://localhost:8000/api/follow/${targetUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      // Update the following status map
      setFollowingMap(prev => ({
        ...prev,
        [targetUserId]: data.isFollowing
      }));
      
      // If we are on the user's own 'following' list and they just unfollowed, remove them from the list
      if (userId === currentUserId && type === 'following' && !data.isFollowing) {
        setUsers(prev => prev.filter(u => u._id !== targetUserId));
      }
      
      // Signal the parent component (ProfilePage) to update the counts
      if (onUpdateCounts) onUpdateCounts();

    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveFollower = async (followerId) => {
    // You should use a custom modal instead of window.confirm, but keeping it for now
    if (!window.confirm('Remove this follower?')) return; 
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/follow/remove/${followerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      // Remove the user from the visible list
      setUsers(prev => prev.filter(u => u._id !== followerId));

      // Signal the parent component (ProfilePage) to update the counts
      if (onUpdateCounts) onUpdateCounts();
      
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  // Logic to determine the button to show
  const isCurrentUserList = userId === currentUserId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <div className="user-details">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  {/* Show action button only if the user is logged in and not viewing their own profile card */}
                  {currentUserId && user._id !== currentUserId && (
                    <div className="user-actions">
                      {/* New Logic Check:
                          1. If it's the current user's list (isCurrentUserList), AND
                          2. We are viewing the 'followers' tab, show REMOVE FOLLOWER button.
                      */}
                      {isCurrentUserList && type === 'followers' ? (
                        <button
                          onClick={() => handleRemoveFollower(user._id)}
                          className="btn btn-outline btn-sm btn-remove"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      ) : 
                       /* New Logic Check:
                          1. If it's the current user's list (isCurrentUserList), AND
                          2. We are viewing the 'following' tab, show UNFOLLOW (REMOVE) button.
                          Note: We use handleUnfollow here (which is just the toggle)
                       */
                      isCurrentUserList && type === 'following' ? (
                        <button
                          onClick={() => handleUnfollow(user._id)}
                          className="btn btn-outline btn-sm btn-remove"
                        >
                          <X size={16} /> Unfollow
                        </button>
                      ) : (
                        /* Default: Show Follow/Following Toggle for all other cases (e.g., viewing someone else's list) */
                        <button
                          onClick={() => handleUnfollow(user._id)} // Using handleUnfollow since it's the same toggle logic
                          className={`btn btn-sm ${
                            followingMap[user._id] ? 'btn-outline' : 'btn-primary'
                          }`}
                        >
                          {followingMap[user._id] ? (
                            <>
                              <UserCheck size={16} /> Following
                            </>
                          ) : (
                            <>
                              <UserPlus size={16} /> Follow
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;
