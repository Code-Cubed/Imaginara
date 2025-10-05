import React from "react";

const PostCard = ({ post }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <img
        src={post.imageUrl || "https://via.placeholder.com/400"}
        alt={post.title || "Artwork"}
        className="w-full object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{post.title || "Untitled"}</h3>
        <p className="text-gray-600 text-sm">{post.description || "No description"}</p>
      </div>
    </div>
  );
};

export default PostCard;
