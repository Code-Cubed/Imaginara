import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MessageCircle, Send, Users, Grid, ArrowLeft, UserPlus, LogIn, LogOut } from 'lucide-react';
import './BoardDetailPage.css';

const BoardDetailPage = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showUsersList, setShowUsersList] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const [myArtworks, setMyArtworks] = useState([]);
  const [showAddArtworkModal, setShowAddArtworkModal] = useState(false);
  const [selectedArtworks, setSelectedArtworks] = useState([]);
  const [loadingArtworks, setLoadingArtworks] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (err) {
      return null;
    }
  };

  const currentUserId = getUserIdFromToken();
  const currentUserName = localStorage.getItem('userName') || 'User';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (socket && currentUserId) {
      socket.emit('typing-board', { boardId: id, userId: currentUserId, userName: currentUserName });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 2000);
    }
  };

  const handleStopTyping = () => {
    if (socket && currentUserId) {
      socket.emit('stop-typing-board', { boardId: id, userId: currentUserId });
    }
  };

  const handleArtworkClick = (artworkId) => {
    navigate(`/artwork/${artworkId}`);
  };

  const handleCreatePersonalRoom = async (otherUserId) => {
    if (!currentUserId) {
      alert('Please login to create a personal room');
      navigate('/login');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/boards/personal-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otherUserId })
      });
      const data = await response.json();
      if (response.ok) navigate(`/personal-room/${data.roomId}`);
      else alert(data.message);
    } catch (err) {
      console.error('Failed to create personal room:', err);
      alert('Failed to create personal room');
    }
  };

  useEffect(() => {
    fetchBoard();
    fetchMessages();

    // Initialize Socket.IO connection — pass JWT so the server can verify identity
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:8000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('join-board', id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('board-error', (data) => {
      console.error('Board access denied:', data.message);
      // Redirect away if not authorized to be in this board room
      alert(data.message);
    });

    // Chat message handler - CRITICAL FIX
    newSocket.on('new-chat-message', (message) => {
      console.log('Received new message:', message);
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        
        // Add new message
        const updated = [...prev, message];
        return updated;
      });
      
      // Scroll to bottom after state update
      setTimeout(scrollToBottom, 100);
    });

    // User presence handlers
    newSocket.on('user-joined-board', (data) => {
      console.log('User joined:', data);
      setOnlineUsers((prev) => prev + 1);
    });

    newSocket.on('user-left-board', (data) => {
      console.log('User left:', data);
      setOnlineUsers((prev) => Math.max(0, prev - 1));
    });

    newSocket.on('member-joined', () => {
      setOnlineUsers((prev) => prev + 1);
      fetchBoard();
    });

    newSocket.on('member-left', () => {
      setOnlineUsers((prev) => Math.max(0, prev - 1));
      fetchBoard();
    });

    newSocket.on('artwork-added', () => {
      fetchBoard();
    });

    // Typing indicator handlers - FIXED
    newSocket.on('user-typing', (data) => {
      console.log('User typing:', data);
      // Don't show typing indicator for current user
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => new Set([...prev, data.userName]));
      }
    });

    newSocket.on('user-stopped-typing', (data) => {
      console.log('User stopped typing:', data);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userName);
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.emit('leave-board', id);
      newSocket.close();
    };
  }, [id, currentUserId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/boards/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch board');
      setBoard(data);

      if (currentUserId && data.members) {
        setIsMember(data.members.some(member => member.user._id === currentUserId));
      }

      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/boards/${id}/chat`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchMyArtworks = async () => {
    if (!currentUserId) {
      setMyArtworks([]);
      return;
    }
    setLoadingArtworks(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/users/${currentUserId}/uploads`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      let artworksArray = Array.isArray(data) ? data : Array.isArray(data.artworks) ? data.artworks : data.data || [];

      // Filter: Only artworks not yet added to this board
      const boardArtworkIds = board?.artworks?.map(item => item.artwork._id) || [];
      artworksArray = artworksArray.filter(art => !boardArtworkIds.includes(art._id));

      setMyArtworks(artworksArray);
    } catch (err) {
      console.error("Failed to fetch your artworks:", err);
      setMyArtworks([]);
    } finally {
      setLoadingArtworks(false);
    }
  };

  const handleOpenAddArtworkModal = async () => {
    if (!currentUserId) {
      alert('Please login to add artwork');
      navigate('/login');
      return;
    }
    if (!isMember) {
      alert('Please join the board first to add artwork');
      return;
    }

    await fetchBoard();
    await fetchMyArtworks();
    setSelectedArtworks([]);
    setShowAddArtworkModal(true);
  };

  const handleAddArtwork = async () => {
    if (selectedArtworks.length === 0) {
      alert("Select at least one artwork");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/boards/${id}/add-artwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ artworkIds: selectedArtworks }),
      });
      const data = await response.json();

      if (response.ok) {
        alert(`${data.addedCount || selectedArtworks.length} artwork(s) added successfully`);
        await fetchBoard();
        await fetchMyArtworks();
        setSelectedArtworks([]);
      } else {
        alert(data.message || 'Failed to add artwork');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add artwork');
    }
  };

  const handleJoinBoard = async () => {
    if (!currentUserId) {
      alert('Please login to join the board');
      navigate('/login');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/boards/${id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIsMember(true);
        setBoard(data.board);
        alert('Successfully joined the board!');
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to join board');
    }
  };

  const handleLeaveBoard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/boards/${id}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIsMember(false);
        alert('Left the board');
        fetchBoard();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to leave board');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!currentUserId) {
      alert('Please login to chat');
      navigate('/login');
      return;
    }
    if (!isMember) {
      alert('Please join the board to participate in chat');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    handleStopTyping();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/boards/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to send message');
        setNewMessage(messageText);
      }
      // Don't manually add message here - let Socket.IO handle it
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
      setNewMessage(messageText);
    }
  };

  const getUniqueUsers = () => {
    if (!board || !board.members) return [];
    return board.members.map(member => member.user).filter(user => user._id !== currentUserId);
  };

  const getAllArtists = () => {
    if (!board || !board.artworks) return [];
    const artistsMap = new Map();
    board.artworks.forEach(item => {
      if (item.artwork && item.artwork.creator) {
        const creator = item.artwork.creator;
        if (!artistsMap.has(creator._id)) artistsMap.set(creator._id, creator);
      }
    });
    return Array.from(artistsMap.values());
  };

  if (loading) return (
    <div className="page-container"><div className="main-content"><div className="loading-container"><div className="loading-spinner"></div><p>Loading board...</p></div></div></div>
  );

  if (error || !board) return (
    <div className="page-container"><div className="main-content"><div className="error-container"><h2>Error</h2><p>{error || 'Board not found'}</p><button onClick={() => navigate('/boards')} className="btn btn-primary">Back to Boards</button></div></div></div>
  );

  const uniqueUsers = getUniqueUsers();
  const allArtists = getAllArtists();

  return (
    <div className="page-container">
      <div className="main-content">
        <div className="board-detail-container">
          {/* Board Header */}
          <div className="board-detail-header">
            <button onClick={() => navigate('/boards')} className="back-btn">
              <ArrowLeft size={20} /> Back
            </button>
            <div className="board-header-info">
              <h1 className="board-detail-title">{board.title}</h1>
              <p className="board-detail-description">{board.description}</p>
              <div className="board-header-stats">
                <span><Grid size={16} /> {board.artworks?.length || 0} Artworks</span>
                <span><Users size={16} /> {board.members?.length || 0} Members</span>
                <span>🎨 {allArtists.length} Artists</span>
              </div>

              {currentUserId && board.creator._id !== currentUserId && (
                <div className="join-section">
                  {!isMember ? (
                    <button onClick={handleJoinBoard} className="btn btn-primary">
                      <LogIn size={16} /> Join Board
                    </button>
                  ) : (
                    <button onClick={handleLeaveBoard} className="btn btn-secondary">
                      <LogOut size={16} /> Leave Board
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowUsersList(!showUsersList)}
                className="toggle-chat-btn"
                disabled={!isMember && board.creator._id !== currentUserId}
              >
                <UserPlus size={20} /> Create Room
              </button>

              <button onClick={() => setShowChat(!showChat)} className="toggle-chat-btn">
                <MessageCircle size={20} /> {showChat ? 'Hide Chat' : 'Show Chat'}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAddArtworkModal}>
            Add Your Artwork
          </button>

          {/* Users List Modal */}
          {showUsersList && (
            <div className="modal-overlay" onClick={() => setShowUsersList(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Create Personal Chat Room</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Select a user to start a private conversation
                </p>
                {uniqueUsers.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
                    No other users available
                  </p>
                ) : (
                  <div className="users-list">
                    {uniqueUsers.map((user) => (
                      <div
                        key={user._id}
                        className="user-item"
                        onClick={() => {
                          handleCreatePersonalRoom(user._id);
                          setShowUsersList(false);
                        }}
                      >
                        <div className="user-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            <div className="avatar-placeholder">{user.name.charAt(0)}</div>
                          )}
                        </div>
                        <div className="user-name">{user.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-actions">
                  <button onClick={() => setShowUsersList(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Artwork Modal */}
          {showAddArtworkModal && (
            <div className="modal-overlay" onClick={() => setShowAddArtworkModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Select Artwork to Add</h2>

                {loadingArtworks ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading your artworks...</p>
                  </div>
                ) : myArtworks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ marginBottom: '16px' }}>You have no uploaded artworks</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/addartwork')}
                    >
                      Upload Artwork
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="artworks-list">
                      {myArtworks.map((art) => (
                        <div
                          key={art._id}
                          className={`artwork-item ${selectedArtworks.includes(art._id) ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedArtworks((prev) =>
                              prev.includes(art._id)
                                ? prev.filter((id) => id !== art._id)
                                : [...prev, art._id]
                            );
                          }}
                        >
                          <img
                            src={art.thumbnailUrl || art.mediaUrl}
                            alt={art.title}
                          />
                          <p>{art.title}</p>
                          {selectedArtworks.includes(art._id) && (
                            <div className="selected-badge">✓</div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="modal-actions">
                      <button
                        className="btn btn-primary"
                        disabled={selectedArtworks.length === 0}
                        onClick={handleAddArtwork}
                      >
                        Add Selected ({selectedArtworks.length})
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddArtworkModal(false);
                          setSelectedArtworks([]);
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="board-content-wrapper">
            {/* Artworks Section */}
            <div className={`artworks-section ${showChat ? 'with-chat' : 'full-width'}`}>
              {allArtists.length > 0 && (
                <div className="artists-section">
                  <h3 className="section-subtitle">Artists in this Board</h3>
                  <div className="artists-grid">
                    {allArtists.map((artist) => (
                      <div key={artist._id} className="artist-card">
                        <div className="artist-avatar">
                          {artist.avatar ? (
                            <img src={artist.avatar} alt={artist.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {artist.name?.charAt(0) || 'A'}
                            </div>
                          )}
                        </div>
                        <div className="artist-name">{artist.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="section-subtitle">All Artworks</h3>
              {board.artworks && board.artworks.length > 0 ? (
                <div className="board-artworks-grid">
                  {board.artworks.map((item) => (
                    <div
                      key={item._id}
                      className="board-artwork-card"
                      onClick={() => handleArtworkClick(item.artwork._id)}
                    >
                      <div className="board-artwork-image">
                        {item.artwork.mediaType === 'image' ? (
                          <img
                            src={item.artwork.thumbnailUrl || item.artwork.mediaUrl}
                            alt={item.artwork.title}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="board-artwork-placeholder"
                          style={{ display: item.artwork.mediaType === 'image' ? 'none' : 'flex' }}
                        >
                          {item.artwork.mediaType === 'audio' ? '🎵' : '📄'}
                        </div>
                      </div>
                      <div className="board-artwork-info">
                        <h4>{item.artwork.title}</h4>
                        <p className="artwork-creator">
                          By {item.artwork.creator?.name || 'Unknown Artist'}
                        </p>
                        {item.note && <p className="artwork-note">{item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-artworks">
                  <Grid size={48} color="#9ca3af" />
                  <p>No artworks in this board yet</p>
                  {isMember && (
                    <button className="btn btn-primary" onClick={handleOpenAddArtworkModal}>
                      Add Your Artwork
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="chat-panel">
                <div className="chat-header">
                  <h3><MessageCircle size={20} /> Board Chat</h3>
                  <span className="online-indicator">{onlineUsers} online</span>
                </div>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-chat">
                      <MessageCircle size={48} color="#9ca3af" />
                      <p>No messages yet. Start the conversation!</p>
                      {!isMember && currentUserId && (
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                          Join the board to participate in chat
                        </p>
                      )}
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`chat-message ${msg.user._id === currentUserId ? 'own-message' : ''}`}
                      >
                        <div className="message-avatar">
                          {msg.user.avatar ? (
                            <img src={msg.user.avatar} alt={msg.user.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {msg.user.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-author">{msg.user.name}</span>
                            <span className="message-time">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="message-text">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {typingUsers.size > 0 && (
                  <div className="typing-indicator">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onBlur={handleStopTyping}
                    placeholder={
                      !currentUserId
                        ? "Please login to chat"
                        : !isMember
                        ? "Join the board to chat"
                        : "Type a message..."
                    }
                    className="chat-input"
                    disabled={!currentUserId || !isMember}
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!newMessage.trim() || !currentUserId || !isMember}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDetailPage;