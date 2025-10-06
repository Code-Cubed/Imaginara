import React from 'react';
import { User, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onLogout }) => {
    const navigate = useNavigate();

    const handleExplore = () => {
        navigate('/explore'); 
    };

    const handleProfile = () => {
        navigate('/profile'); 
    };

    return (
    <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={handleExplore}
          className="group relative flex items-center gap-1.5 px-3 py-2 md:gap-2.5 md:px-5 md:py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-md transition-all duration-300 ease-out hover:shadow-xl hover:scale-110 hover:from-purple-700 hover:to-pink-700 text-sm md:text-base"
        >
          <Compass 
            size={18} 
            className="transition-transform duration-300 ease-out group-hover:rotate-180 md:w-5 md:h-5" 
          />
          <span className="hidden sm:inline transition-all duration-300 ease-out">
            Explore
          </span>
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>

        <button
          onClick={handleProfile}
          className="group relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-gray-100 shadow-md transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:shadow-xl hover:scale-110"
          aria-label="User Profile"
        >
          <User 
            size={20} 
            className="text-gray-700 transition-all duration-300 ease-out group-hover:text-white group-hover:scale-110 md:w-6 md:h-6" 
          />
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  );
};

export default TopBar;