import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Grid, Layout, MessageSquare } from 'lucide-react';
import './BoardsPage.css';

const BoardsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPersonalRooms, setShowPersonalRooms] = useState(false);
  const [personalRooms, setPersonalRooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBoard, setNewBoard] = useState({
    title: '',
    description: '',
    category: 'General',
    visibility: 'public'
  });

  useEffect(() => {
    fetchBoards();
    fetchPersonalRooms();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/boards');
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch boards');

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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalRooms(data);
      }
    } catch (err) {
      console.error('Failed to fetch personal rooms:', err);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoard.title.trim()) return alert('Please enter a board title');

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch('http://localhost:8000/api/boards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBoard)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create board');

      alert('Board created successfully!');
      setShowCreateModal(false);
      setNewBoard({ title: '', description: '', category: 'General', visibility: 'public' });
      fetchBoards();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleBoardClick = (boardId) => navigate(`/boards/${boardId}`);
  const handlePersonalRoomClick = (roomId) => navigate(`/personal-room/${roomId}`);

  if (loading) return (
    <div className="page-container">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading boards...</p>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="main-content">
        <div className="boards-container">
          {/* Header */}
          <div className="boards-header">
            <div>
              <h1 className="boards-title">
                <Layout size={32} />
                Collaborative Boards
              </h1>
              <p className="boards-subtitle">
                Create and join boards to collaborate with other artists
              </p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => setShowPersonalRooms(!showPersonalRooms)}
                className="btn btn-secondary"
              >
                <MessageSquare size={20} />
                Personal Rooms ({personalRooms.length})
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus size={20} />
                Create Board
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Create Board Modal */}
          {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Create New Board</h2>
                <form onSubmit={handleCreateBoard}>
                  <div className="form-group">
                    <label>Board Title *</label>
                    <input
                      type="text"
                      value={newBoard.title}
                      onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                      placeholder="Enter board title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newBoard.description}
                      onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                      placeholder="Describe what this board is about"
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newBoard.category}
                      onChange={(e) => setNewBoard({ ...newBoard, category: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Digital Art">Digital Art</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Photography">Photography</option>
                      <option value="3D Art">3D Art</option>
                      <option value="Animation">Animation</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Visibility</label>
                    <select
                      value={newBoard.visibility}
                      onChange={(e) => setNewBoard({ ...newBoard, visibility: e.target.value })}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="members-only">Members Only</option>
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={creating || !newBoard.title.trim()} className="btn btn-primary">
                      {creating ? 'Creating...' : 'Create Board'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Personal Rooms */}
          {showPersonalRooms && (
            <div className="personal-rooms-section">
              <h2 className="section-title">Your Personal Chat Rooms</h2>
              {personalRooms.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} color="#9ca3af" />
                  <p>No personal chat rooms yet</p>
                  <p className="empty-description">
                    Create a personal room from any board to chat privately with other users
                  </p>
                </div>
              ) : (
                <div className="personal-rooms-grid">
                  {personalRooms.map((room) => {
                    const currentUserId = localStorage.getItem('userId');
                    const otherUser = room.participants?.find(p => p._id !== currentUserId);
                    return (
                      <div
                        key={room._id}
                        className="personal-room-card"
                        onClick={() => handlePersonalRoomClick(room.roomId || room._id)}
                      >
                        <div className="room-avatar">
                          {otherUser?.avatar ? (
                            <img src={otherUser.avatar} alt={otherUser.name} />
                          ) : (
                            <div className="avatar-placeholder">{otherUser?.name?.charAt(0) || 'U'}</div>
                          )}
                        </div>
                        <div className="room-info">
                          <h3>{otherUser?.name || 'Unknown User'}</h3>
                          {room.lastMessage && <p className="last-message">{room.lastMessage.message?.substring(0, 50)}...</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Boards */}
          <div className="boards-section">
            <h2 className="section-title">All Boards</h2>
            {boards.length === 0 ? (
              <div className="empty-state">
                <Layout size={64} color="#9ca3af" />
                <h3>No boards yet</h3>
                <p>Create your first board to start collaborating with other artists</p>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ marginTop: '12px' }}>
                  <Plus size={16} />
                  Create Your First Board
                </button>
              </div>
            ) : (
              <div className="boards-grid">
                {boards.map((board) => (
                  <div key={board._id} className="board-card" onClick={() => handleBoardClick(board._id)}>
                    <div className="board-cover">
                      {board.coverImage ? (
                        <img src={board.coverImage} alt={board.title} />
                      ) : (
                        <div className="board-cover-placeholder"><Grid size={48} /></div>
                      )}
                      <div className="board-overlay">
                        <span className="board-visibility">{board.visibility}</span>
                      </div>
                    </div>
                    <div className="board-info">
                      <h3 className="board-title">{board.title}</h3>
                      {board.description && <p className="board-description">{board.description}</p>}
                      <div className="board-meta">
                        <div className="board-creator">
                          <div className="creator-avatar-small">
                            {board.creator?.avatar ? <img src={board.creator.avatar} alt={board.creator.name} /> :
                              <div className="avatar-placeholder">{board.creator?.name?.charAt(0) || 'U'}</div>}
                          </div>
                          <span>{board.creator?.name}</span>
                        </div>
                        <div className="board-stats">
                          <span><Users size={14} /> {board.members?.length || 0}</span>
                          <span><Grid size={14} /> {board.artworks?.length || 0}</span>
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
