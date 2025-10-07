import React, { useState, useRef, useEffect } from "react";
import LeftBar from "../../components/leftBar/LeftBar";

const ChatBot = () => {
  const [conversation, setConversation] = useState([]); // {role,text}
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text) return;

    const updatedConversation = [...conversation, { role: "user", text }];
    setConversation(updatedConversation);
    setUserInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: updatedConversation }),
      });

      const data = await res.json();
      const aiText = data.aiText || "⚠️ Something went wrong.";

      setConversation([...updatedConversation, { role: "bot", text: aiText }]);
    } catch (err) {
      console.error(err);
      setConversation([
        ...updatedConversation,
        { role: "bot", text: "⚠️ Error connecting to server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <LeftBar />

      {/* Chat Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 shadow-md bg-white flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">💬 Imaginara ChatBot</h1>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
          {conversation.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              👋 Hi! Ask me anything about art or creativity.
            </div>
          )}

          {conversation.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl p-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white shadow-sm text-gray-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm text-gray-500 rounded-2xl p-3">Typing...</div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
