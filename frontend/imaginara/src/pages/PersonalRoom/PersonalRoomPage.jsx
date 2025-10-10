import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MessageCircle, Send, ArrowLeft, User } from 'lucide-react';
import LeftBar from '../../components/leftBar/LeftBar';
import TopBar from '../../components/topBar/topBar';
import './PersonRoomPage.css';

const PersonalRoomPage = ({ onLogout }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
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
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    fetchMessages();

    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    newSocket.emit('join-personal-room', roomId);

    newSocket.on('new-personal-message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('user-typing-personal', (data) => {
      if (data.userId !== currentUserId) {
        setTypingUser(data.userName);
      }
    });

    newSocket.on('user-stopped-typing-personal', (data) => {
      if (data.userId !== currentUserId) {
        setTypingUser(null);
      }
    });

    return () => {
      newSocket.emit('leave-personal-room', roomId);
      newSocket.close();
    };
  }, [roomId, currentUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/boards/personal-rooms/${roomId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);

      // Get other user info from messages
      if (data.length > 0) {
        const otherUserFromMsg = data.find(msg => msg.user._id !== currentUserId)?.user;
        if (otherUserFromMsg) {
          setOtherUser(otherUserFromMsg);
        }
      }

      setTimeout(scrollToBottom, 100);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/boards/personal-rooms/${roomId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: newMessage })
        }
      );

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
      socket.emit('typing-personal-room', {
        roomId: roomId,
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
      socket.emit('stop-typing-personal-room', {
        roomId: roomId,
        userId: currentUserId
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="page-container">
        <LeftBar onLogout={onLogout} />
        <div className="main-content">
          <TopBar />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <LeftBar onLogout={onLogout} />
      
      <div className="main-content">
        <TopBar />
        
        <div className="personal-room-container">
          {/* Room Header */}
          <div className="room-header">
            <button onClick={() => navigate('/boards')} className="back-btn">
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="room-user-info">
              <div className="room-user-avatar">
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} alt={otherUser.name} />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div>
                <h1 className="room-title">
                  {otherUser?.name || 'Personal Chat'}
                </h1>
                <p className="room-subtitle">Private conversation</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {/* Chat Area */}
          <div className="personal-chat-container">
            <div className="personal-chat-messages">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <MessageCircle size={64} color="#9ca3af" />
                  <h3>Start your conversation</h3>
                  <p>Send a message to begin chatting</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`personal-message ${
                      msg.user._id === currentUserId ? 'own-message' : 'other-message'
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

            {typingUser && (
              <div className="typing-indicator">
                {typingUser} is typing...
              </div>
            )}

            <form onSubmit={handleSendMessage} className="personal-chat-input-form">
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
        </div>
      </div>
    </div>
  );
};

export default PersonalRoomPage;