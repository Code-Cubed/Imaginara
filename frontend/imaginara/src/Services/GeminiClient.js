import { GoogleGenAI } from '@google/genai';



const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 




const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Creates a new chat session.
 * * @returns {Promise<object>} 
 */
export function createChatSession() {
    // Basic check to ensure API key is available before creating the session
    if (!API_KEY) {
        console.error("Gemini API Key is missing. Check your .env file and VITE_ prefix.");
        return null;
    }
    
    return ai.chats.create({ 
        model: "gemini-2.5-flash", // Fast, general-purpose model
        config: {
            // Optional: System instruction to guide the model's behavior
            systemInstruction: "You are a friendly, concise, and helpful AI assistant named ReactBot.",
        },
    });
}

/**
 * Sends a message to the Gemini chat model using a chat session object.
 * * @param {string} message The user's input message.
 * @param {object} chat The chat session object (from createChatSession()).
 * @returns {Promise<string>} The AI's response text.
 */
export async function sendMessageToGemini(message, chat) {
    if (!chat) return "Chat service is not initialized. Please ensure the API key is set correctly.";
    
    try {
        // Use the chat object's sendMessage method to maintain conversation history
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, I ran into an error. Please check the console and your API key.";
    }
}