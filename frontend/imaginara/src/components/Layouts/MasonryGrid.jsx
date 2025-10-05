import React from "react";
import PostCard from "./PostCard";

const MasonryGrid = ({ posts }) => {
  if (!posts.length) return <p className="text-center text-gray-500">No posts found.</p>;

  return (
    <div className="columns-3 gap-4 space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id || post.id} post={post} />
      ))}
    </div>
  );
};

export default MasonryGrid;
