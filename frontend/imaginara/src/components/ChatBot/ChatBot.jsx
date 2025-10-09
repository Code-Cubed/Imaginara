// components/ChatBot/ChatBot.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { ThemeContext } from "../../Context/ThemeContext";
import LeftBar from "../leftBar/LeftBar";
import "./ChatBot.css";

const ChatBot = ({ onLogout }) => {
  const { theme } = useContext(ThemeContext);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  // Scroll to bottom whenever conversation updates
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text) return;

    // Add user message to conversation
    const updatedConversation = [...conversation, { role: "user", text }];
    setConversation(updatedConversation);
    setUserInput("");
    setIsLoading(true);

    try {
      // The URL is correct: http://localhost:8000/api/gemini/chat
      const res = await fetch("http://localhost:8000/api/gemini/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation: updatedConversation }),
      });

      if (!res.ok) {
        // Throw an error with the status code for logging
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const aiText = data.aiText || "⚠️ No response from AI.";

      // Add bot response
      setConversation([...updatedConversation, { role: "bot", text: aiText }]);
    } catch (err) {
      console.error("Chat error:", err);
      // Enhanced error message to show the specific error (e.g., 404, 500)
      setConversation([
        ...updatedConversation,
        { role: "bot", text: `⚠️ Error connecting to AI. Please try again. (Details: ${err.message})` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setConversation([]);
  };

  return (
    <div className={`chatbot-container ${theme}`} data-theme={theme}>
      <LeftBar onLogout={onLogout} />

      <div className="chatbot-main">
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-content">
            <h1 className="header-title">
              <span className="header-icon">💬</span>
              Imaginara AI Assistant
            </h1>
            <p className="header-subtitle">
              Ask me anything about art, creativity, or your artworks!
            </p>
          </div>
          {conversation.length > 0 && (
            <button onClick={clearChat} className="clear-btn">
              Clear Chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={chatRef} className="chatbot-messages">
          {conversation.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎨</div>
              <h3>Welcome to Imaginara AI!</h3>
              <p>I'm here to help you with:</p>
              <ul className="welcome-list">
                <li>✨ Art techniques and tips</li>
                <li>🎨 Creative inspiration</li>
                <li>📚 Art history questions</li>
                <li>💡 Project ideas</li>
              </ul>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.role === "user" ? "user-message" : "bot-message"}`}
            >
              <div className="message-avatar">
                {msg.role === "user" ? "👤" : "🤖"}
              </div>
              <div className="message-bubble">
                <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message bot-message">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="chatbot-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="send-btn"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;