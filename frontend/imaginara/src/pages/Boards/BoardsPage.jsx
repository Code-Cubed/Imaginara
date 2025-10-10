import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, Eye, Grid, Layout, MessageSquare } from 'lucide-react';

import './BoardsPage.css';

const BoardsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoCreating, setAutoCreating] = useState(false);
  const [showPersonalRooms, setShowPersonalRooms] = useState(false);
  const [personalRooms, setPersonalRooms] = useState([]);

  useEffect(() => {
    fetchBoards();
    fetchPersonalRooms();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/boards');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch boards');
      }

      setBoards(data.boards || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/boards/personal-rooms/my-rooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalRooms(data);
      }
    } catch (err) {
      console.error('Failed to fetch personal rooms:', err);
    }
  };

  const handleAutoCreateBoards = async () => {
    try {
      setAutoCreating(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/boards/auto-create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to auto-create boards');
      }

      alert(`✨ ${data.message}`);
      fetchBoards();
    } catch (err) {
      alert(err.message);
    } finally {
      setAutoCreating(false);
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/boards/${boardId}`);
  };

  const handlePersonalRoomClick = (roomId) => {
    navigate(`/personal-room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="page-container">
       
        <div className="main-content">
      
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading boards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
    
      
      <div className="main-content">
       
        
        <div className="boards-container">
          <div className="boards-header">
            <div>
              <h1 className="boards-title">
                <Layout size={32} />
                Collaborative Boards
              </h1>
              <p className="boards-subtitle">
                Auto-generated boards based on artwork titles with real-time chat
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPersonalRooms(!showPersonalRooms)}
                className="btn btn-secondary"
              >
                <MessageSquare size={20} />
                Personal Rooms ({personalRooms.length})
              </button>
              <button
                onClick={handleAutoCreateBoards}
                disabled={autoCreating}
                className="btn btn-primary"
              >
                <Zap size={20} />
                {autoCreating ? 'Creating...' : 'Auto-Create Boards'}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {/* Personal Rooms Section */}
          {showPersonalRooms && (
            <div className="personal-rooms-section">
              <h2 className="section-title">Your Personal Chat Rooms</h2>
              {personalRooms.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} color="#9ca3af" />
                  <p>No personal chat rooms yet</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Create a personal room from any board to chat privately with other users
                  </p>
                </div>
              ) : (
                <div className="personal-rooms-grid">
                  {personalRooms.map((room) => {
                    const otherUser = room.participants.find(
                      p => p._id !== localStorage.getItem('userId')
                    );
                    return (
                      <div
                        key={room._id}
                        className="personal-room-card"
                        onClick={() => handlePersonalRoomClick(room.roomId)}
                      >
                        <div className="room-avatar">
                          {otherUser?.avatar ? (
                            <img src={otherUser.avatar} alt={otherUser.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {otherUser?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="room-info">
                          <h3>{otherUser?.name || 'Unknown User'}</h3>
                          {room.lastMessage && (
                            <p className="last-message">
                              {room.lastMessage.message.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Boards Section */}
          <div className="boards-section">
            <h2 className="section-title">All Boards</h2>
            {boards.length === 0 ? (
              <div className="empty-state">
                <Layout size={64} color="#9ca3af" />
                <h3>No boards yet</h3>
                <p>Click "Auto-Create Boards" to generate boards from your artworks</p>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                  Boards will be automatically created based on artwork titles
                </p>
                <button
                  onClick={handleAutoCreateBoards}
                  disabled={autoCreating}
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                >
                  <Zap size={20} />
                  {autoCreating ? 'Creating...' : 'Auto-Create Boards'}
                </button>
              </div>
            ) : (
              <div className="boards-grid">
                {boards.map((board) => (
                  <div
                    key={board._id}
                    className="board-card"
                    onClick={() => handleBoardClick(board._id)}
                  >
                    <div className="board-cover">
                      {board.coverImage ? (
                        <img src={board.coverImage} alt={board.title} />
                      ) : (
                        <div className="board-cover-placeholder">
                          <Grid size={48} />
                        </div>
                      )}
                      <div className="board-overlay">
                        <span className="board-visibility">{board.visibility}</span>
                      </div>
                    </div>
                    <div className="board-info">
                      <h3 className="board-title">{board.title}</h3>
                      {board.description && (
                        <p className="board-description">{board.description}</p>
                      )}
                      <div className="board-meta">
                        <div className="board-creator">
                          <div className="creator-avatar-small">
                            {board.creator?.avatar ? (
                              <img src={board.creator.avatar} alt={board.creator.name} />
                            ) : (
                              <div className="avatar-placeholder">
                                {board.creator?.name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <span>{board.creator?.name}</span>
                        </div>
                        <div className="board-stats">
                          <span>
                            <Users size={14} />
                            {board.collaborators?.length || 0}
                          </span>
                          <span>
                            <Grid size={14} />
                            {board.artworks?.length || 0}
                          </span>
                          <span>
                            <Eye size={14} />
                            {board.stats?.views || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardsPage;