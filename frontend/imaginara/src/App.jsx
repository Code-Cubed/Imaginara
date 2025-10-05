import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import HomePage from "./pages/Home/Home";
import ProfilePage from "./pages/Profile/ProfilePage";
import TopBar from "./components/topBar/TopBar";
import LeftBar from "./components/leftBar/LeftBar";


const AppLayout = ({ children, onLogout }) => (
  <div className="flex h-screen bg-gray-50">
    <LeftBar onLogout={onLogout} />
    <div className="flex-1 flex flex-col">
      <TopBar />
      <div className="p-4 flex-1 overflow-y-auto">{children}</div>
    </div>
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/signup" element={<SignUp onSignUp={() => setIsAuthenticated(true)} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route
              path="/home"
              element={
                <AppLayout onLogout={handleLogout}>
                  <HomePage />
                </AppLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <AppLayout onLogout={handleLogout}>
                  <ProfilePage />
                </AppLayout>
              }
            />
            <Route path="*" element={<Navigate to="/home" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
