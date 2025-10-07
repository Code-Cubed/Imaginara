import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../../components/topBar/topBar";

const ArtworkDetail = () => {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
