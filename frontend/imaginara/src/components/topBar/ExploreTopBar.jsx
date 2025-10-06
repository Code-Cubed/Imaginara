import React, { useState } from "react";
import { Search } from "lucide-react";

const ExploreTopBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between max-w-6xl mx-auto mb-6 px-2 sm:px-0 py-2">
      <h2 className="text-2xl font-bold text-gray-900">Explore</h2>
      <div className="relative w-full max-w-xs">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search art, stories, photos..."
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>
    </div>
  );
};

export default ExploreTopBar;
