import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bookmark, BookmarkCheck, Trash2, Edit, X } from 'lucide-react'; 
import LeftBar from '../../components/leftBar/LeftBar';
import './ArtworkDetail.css';
import TopBar from '../../components/topBar/topBar';

const ArtworkDetail = () => {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState(''); 
  const [socket, setSocket] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // NEW: State for comment editing
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');


  // Get current user ID from token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (err) {
      return null;
    }
  };

  const currentUserId = getUserIdFromToken();

  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    newSocket.emit('join-artwork', id);

    // Socket listeners
    newSocket.on('new-comment', (newComment) => {
      // Only update if it's not the current user's comment (to avoid duplicates)
      if (newComment.user._id !== currentUserId) {
        setComments((prev) => [newComment, ...prev]);
        setArtwork((prev) => ({
          ...prev,
          commentsCount: prev.commentsCount + 1
        }));
      }
    });
    
    // NEW: Handle real-time comment updates
    newSocket.on('comment-updated', (updatedComment) => {
        setComments(prevComments => prevComments.map(c => 
            c._id === updatedComment._id ? updatedComment : c
        ));
    });

    // NEW: Handle real-time comment deletion
    newSocket.on('comment-deleted', ({ commentId, artworkId }) => {
        setComments(prevComments => prevComments.filter(c => c._id !== commentId));
        setArtwork(prev => prev ? { ...prev, commentsCount: prev.commentsCount - 1 } : prev);
    });

    newSocket.on('like-updated', (data) => {
      setArtwork((prev) => ({
        ...prev,
        // Assuming data.likes is the new count or array length
        likes: { length: data.likes } 
      }));
    });

    newSocket.on('view-updated', (data) => {
      setArtwork((prev) => ({
        ...prev,
        views: data.views
      }));
    });

    return () => {
      newSocket.emit('leave-artwork', id);
      newSocket.close();
    };
  }, [id, currentUserId]);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/artworks/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch artwork");
        setArtwork(data);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">Loading...</div>
    );

  if (error)
    return <div className="text-red-500 text-center mt-4">{error}</div>;

  if (!artwork)
    return <div className="text-center mt-4">Artwork not found</div>;

  return (
    <div className="flex flex-col h-full p-6">
      <TopBar />
      <div className="artwork-detail mt-6">
        <h1 className="text-3xl font-bold mb-4">{artwork.title}</h1>
        <p className="text-gray-600 mb-2">By {artwork.creator?.name || "Unknown"}</p>
        {artwork.category && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
            {artwork.category}
          </span>
        )}
        <div className="mt-4">
          {artwork.mediaType === "image" ? (
            <img
              src={artwork.mediaUrl}
              alt={artwork.title}
              className="max-w-full rounded-lg"
            />
          ) : artwork.mediaType === "video" ? (
            <video
              src={artwork.mediaUrl}
              controls
              className="max-w-full rounded-lg"
            />
          ) : (
            <p>Unsupported media type</p>
          )}
        </div>
        <div className="mt-4 text-gray-700">
          <p>{artwork.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;
