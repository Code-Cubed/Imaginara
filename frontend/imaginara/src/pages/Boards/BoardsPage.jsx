import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Eye, Grid, Layout } from 'lucide-react';


import './BoardsPage.css';

const BoardsPage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoard, setNewBoard] = useState({
    title: '',
    description: '',
    visibility: 'public',
    category: '',
    tags: ''
  });

  useEffect(() => {
    fetchBoards();
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

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!newBoard.title.trim()) {
      alert('Please enter a board title');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBoard)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create board');
      }

      setBoards([data, ...boards]);
      setShowCreateModal(false);
      setNewBoard({
        title: '',
        description: '',
        visibility: 'public',
        category: '',
        tags: ''
      });

      // Navigate to the new board
      navigate(`/boards/${data._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/boards/${boardId}`);
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
                Create and collaborate on curated collections
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Create Board
            </button>
          </div>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {boards.length === 0 ? (
            <div className="empty-state">
              <Layout size={64} color="#9ca3af" />
              <h3>No boards yet</h3>
              <p>Create your first collaborative board to organize artworks</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus size={20} />
                Create Board
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

          {/* Create Board Modal */}
          {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Create New Board</h2>
                <form onSubmit={handleCreateBoard}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      value={newBoard.title}
                      onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                      className="form-input"
                      placeholder="My Awesome Board"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={newBoard.description}
                      onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                      className="form-textarea"
                      placeholder="What's this board about?"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Visibility</label>
                    <select
                      value={newBoard.visibility}
                      onChange={(e) => setNewBoard({ ...newBoard, visibility: e.target.value })}
                      className="form-select"
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="unlisted">Unlisted - Only with link</option>
                      <option value="private">Private - Only collaborators</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      value={newBoard.category}
                      onChange={(e) => setNewBoard({ ...newBoard, category: e.target.value })}
                      className="form-input"
                      placeholder="Art, Photography, Design..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newBoard.tags}
                      onChange={(e) => setNewBoard({ ...newBoard, tags: e.target.value })}
                      className="form-input"
                      placeholder="abstract, modern, colorful"
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create Board
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardsPage;