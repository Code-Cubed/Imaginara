import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MessageCircle, Send, Users, Grid, ArrowLeft, UserPlus } from 'lucide-react';

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

  useEffect(() => {
    fetchBoard();
    fetchMessages();

    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    newSocket.emit('join-board', id);

    newSocket.on('new-chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('user-joined-board', () => {
      setOnlineUsers((prev) => prev + 1);
    });

    newSocket.on('user-left-board', () => {
      setOnlineUsers((prev) => Math.max(0, prev - 1));
    });

    newSocket.on('user-typing', (data) => {
      setTypingUsers((prev) => new Set([...prev, data.userName]));
    });

    newSocket.on('user-stopped-typing', (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userName);
        return newSet;
      });
    });

    return () => {
      newSocket.emit('leave-board', id);
      newSocket.close();
    };
  }, [id]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/boards/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch board');
      }

      setBoard(data);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (!currentUserId) {
      alert('Please login to chat');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/boards/${id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        handleStopTyping();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleTyping = () => {
    if (socket && currentUserId) {
      socket.emit('typing-board', {
        boardId: id,
        userId: currentUserId,
        userName: currentUserName
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleStopTyping = () => {
    if (socket && currentUserId) {
      socket.emit('stop-typing-board', {
        boardId: id,
        userId: currentUserId
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId })
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/personal-room/${data.roomId}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to create personal room:', err);
      alert('Failed to create personal room');
    }
  };

  // Get unique users from board
  const getUniqueUsers = () => {
    if (!board) return [];
    
    const usersMap = new Map();
    
    // Add creator
    if (board.creator) {
      usersMap.set(board.creator._id, board.creator);
    }
    
    // Add collaborators
    board.collaborators?.forEach(user => {
      usersMap.set(user._id, user);
    });
    
    // Add artwork creators
    board.artworks?.forEach(item => {
      if (item.artwork?.creator) {
        usersMap.set(item.artwork.creator._id, item.artwork.creator);
      }
    });
    
    return Array.from(usersMap.values()).filter(user => user._id !== currentUserId);
  };

  if (loading) {
    return (
      <div className="page-container">
       
        <div className="main-content">
         
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading board...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="page-container">
       
        <div className="main-content">
         
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Board not found'}</p>
            <button onClick={() => navigate('/boards')} className="btn btn-primary">
              Back to Boards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const uniqueUsers = getUniqueUsers();

  return (
    <div className="page-container">
      
      
      <div className="main-content">
       
        
        <div className="board-detail-container">
          {/* Board Header */}
          <div className="board-detail-header">
            <button onClick={() => navigate('/boards')} className="back-btn">
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="board-header-info">
              <h1 className="board-detail-title">{board.title}</h1>
              <p className="board-detail-description">{board.description}</p>
              <div className="board-header-stats">
                <span>
                  <Grid size={16} />
                  {board.artworks?.length || 0} Artworks
                </span>
                <span>
                  <Users size={16} />
                  {onlineUsers} Online
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowUsersList(!showUsersList)}
                className="toggle-chat-btn"
              >
                <UserPlus size={20} />
                Create Room
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="toggle-chat-btn"
              >
                <MessageCircle size={20} />
                {showChat ? 'Hide Chat' : 'Show Chat'}
              </button>
            </div>
          </div>

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
                            <div className="avatar-placeholder">
                              {user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="user-name">{user.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-actions">
                  <button
                    onClick={() => setShowUsersList(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="board-content-wrapper">
            {/* Artworks Grid */}
            <div className={`artworks-section ${showChat ? 'with-chat' : 'full-width'}`}>
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
                          />
                        ) : (
                          <div className="board-artwork-placeholder">
                            {item.artwork.mediaType === 'audio' ? '🎵' : '📄'}
                          </div>
                        )}
                      </div>
                      <div className="board-artwork-info">
                        <h4>{item.artwork.title}</h4>
                        <p className="artwork-creator">
                          By {item.artwork.creator?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-artworks">
                  <Grid size={48} color="#9ca3af" />
                  <p>No artworks in this board yet</p>
                </div>
              )}
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="chat-panel">
                <div className="chat-header">
                  <h3>
                    <MessageCircle size={20} />
                    Board Chat
                  </h3>
                  <span className="online-indicator">
                    {onlineUsers} online
                  </span>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-chat">
                      <MessageCircle size={48} color="#9ca3af" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`chat-message ${
                          msg.user._id === currentUserId ? 'own-message' : ''
                        }`}
                      >
                        <div className="message-avatar">
                          {msg.user.avatar ? (
                            <img src={msg.user.avatar} alt={msg.user.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {msg.user.name.charAt(0)}
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
                    placeholder="Type a message..."
                    className="chat-input"
                  />
                  <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
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