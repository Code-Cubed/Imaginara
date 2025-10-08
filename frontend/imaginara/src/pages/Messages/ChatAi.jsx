import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatAI = () => {
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, loading]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const newChat = [...chat, { sender: "user", text: prompt }];
    setChat(newChat);
    setPrompt("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/generate-image",
        { prompt }
      );

      setChat([...newChat, { sender: "ai", image: res.data.image }]);
    } catch (err) {
      console.error(err);
      setChat([...newChat, { sender: "ai", text: "⚠️ Failed to generate image." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      >
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-3 rounded-lg max-w-[75%] break-words ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {msg.text && <p>{msg.text}</p>}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="AI"
                  className="mt-2 rounded-lg border max-h-80 object-contain"
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-center text-gray-500">⏳ Generating image...</div>
        )}
      </div>

      {/* Input box */}
      <div className="p-4 bg-white border-t flex">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleEnter}
          placeholder="Type a prompt..."
          className="flex-1 p-2 border rounded-md focus:ring focus:ring-indigo-300"
        />
        <button
          onClick={handleSend}
          className="ml-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatAI;
