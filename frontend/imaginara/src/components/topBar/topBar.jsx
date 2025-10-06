import React from 'react';
import { User, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ onLogout }) => {
    const navigate = useNavigate();

    const handleExplore = () => {
        navigate('/explore'); // Link to ExplorePage
    };

    const handleProfile = () => {
        navigate('/profile'); // Link to ProfilePage
    };

    return (
        <div className="fixed top-6 right-6 z-50">
            <div className="flex items-center gap-4">
                {/* EXPLORE Button */}
                <button
                    onClick={handleExplore}
                    className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-md transition-all duration-300 ease-out hover:shadow-xl hover:scale-110 hover:from-purple-700 hover:to-pink-700"
                >
                    <Compass 
                        size={20} 
                        className="transition-transform duration-300 ease-out group-hover:rotate-180" 
                    />
                    <span className="transition-all duration-300 ease-out">
                        Explore
                    </span>
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>

                {/* USER PROFILE Button */}
                <button
                    onClick={handleProfile}
                    className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 shadow-md transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:shadow-xl hover:scale-110"
                    aria-label="User Profile"
                >
                    <User 
                        size={22} 
                        className="text-gray-700 transition-all duration-300 ease-out group-hover:text-white group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
            </div>
        </div>
    );
};

export default TopBar;
