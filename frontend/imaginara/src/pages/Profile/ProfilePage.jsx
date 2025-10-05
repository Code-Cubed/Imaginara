import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import Home from "../Home/Home";

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-start gap-4 mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <User size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">User Profile</h1>
            <p className="text-sm text-gray-500">
              User ID: <span className="font-mono">02S54958894937359006</span>
            </p>
          </div>
        </div>

        
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Uploads (0)</h2>
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <p className="text-gray-500 italic">
              You haven't uploaded any content yet. Head back to the gallery!
            </p>
          </div>
        </div>

        
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Saved Content (0)</h2>
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <p className="text-gray-500 italic">
              You haven't saved any posts yet. Use the bookmark icon in the gallery!
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
