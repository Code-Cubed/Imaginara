import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Assuming you stored user info (including avatar) in localStorage after login
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleExplore = () => navigate('/explore');
  const handleProfile = () => navigate('/profile');

  return (
    <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Explore Button */}
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

        {/* Profile Button */}
        <button
          onClick={handleProfile}
          className="group relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-gray-100 shadow-md overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:scale-110"
          aria-label="User Profile"
        >
          {user && user.avatar ? (
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default TopBar;
