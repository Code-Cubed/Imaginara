import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import LeftBar from "../../components/leftBar/LeftBar";

const ProfilePage = ({ onLogout }) => {
  const navigate = useNavigate();

  
  const [uploads, setUploads] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [comments, setComments] = useState([]);

  // Sample function to add dummy upload
  const addUpload = () => {
    const newUpload = {
      id: Date.now(),
      title: "New Artwork " + (uploads.length + 1),
      type: "ART",
      color: "#F87171",
      likes: 0,
      comments: 0,
    };
    setUploads([newUpload, ...uploads]);
  };

  // Sample function to add dummy bookmark
  const addBookmark = () => {
    if (uploads.length === 0) return;
    const newBookmark = uploads[0];
    setBookmarks([newBookmark, ...bookmarks]);
  };

  // Sample function to add dummy comment
  const addComment = () => {
    if (uploads.length === 0) return;
    const newComment = {
      id: Date.now(),
      content: "This is a new comment!",
      post: uploads[0].title,
    };
    setComments([newComment, ...comments]);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftBar onLogout={onLogout} />

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">

          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">User Profile</h1>
              <p className="text-sm sm:text-base text-gray-500">User ID: <span className="font-mono">02S54958894937359006</span></p>

              
              <div className="flex gap-2 mt-2">
                <button onClick={addUpload} className="px-3 py-1 bg-green-500 text-white rounded">Add Upload</button>
                <button onClick={addBookmark} className="px-3 py-1 bg-yellow-500 text-white rounded">Add Bookmark</button>
                <button onClick={addComment} className="px-3 py-1 bg-blue-500 text-white rounded">Add Comment</button>
              </div>
            </div>
          </div>

          
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Your Uploads ({uploads.length})</h2>
            {uploads.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <p className="text-gray-500 italic">You haven't uploaded anything yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.map((item) => (
                  <div key={item.id} className="rounded-xl p-4 text-white shadow-md hover:scale-[1.03] transition-transform duration-300" style={{ backgroundColor: item.color }}>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <div className="flex justify-between text-sm opacity-90">
                      <span> {item.likes}</span>
                      <span> {item.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Saved Items ({bookmarks.length})</h2>
            {bookmarks.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <p className="text-gray-500 italic">You haven't saved any items yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarks.map((item) => (
                  <div key={item.id} className="rounded-xl p-4 text-white shadow-md hover:scale-[1.03] transition-transform duration-300" style={{ backgroundColor: item.color }}>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <div className="flex justify-between text-sm opacity-90">
                      <span> {item.likes}</span>
                      <span> {item.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Your Comments ({comments.length})</h2>
            {comments.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <p className="text-gray-500 italic">You haven't commented yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-gray-700">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-2">On: <span className="font-medium">{comment.post}</span></p>
                  </div>
                ))}
              </div>
            )}
          </section>

          
          <div className="flex justify-center mt-6">
            <button onClick={() => navigate("/home")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Back to Home</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
