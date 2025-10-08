import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import HomePage from "./pages/Artwork/ArtworkList";
import ArtworkDetail from "./pages/Artwork/ArtworkDetail";
import AddArtwork from "./pages/Artwork/Addartwork";
import ExplorePage from "./pages/Home/ExplorePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import Settings from "./pages/Settings/Settings";
import ForgotPassword from './pages/Auth/ForgetPassword';
import ChatBot from './components/ChatBot/ChatBot'; 
import ProtectedLayout from "./components/ProtectedLayout";
import { ThemeProvider, ThemeContext } from "./Context/ThemeContext";
import DiscoverUsers from './pages/Discover/DiscoverUsers';
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme } = useContext(ThemeContext); // ✅ added missing import
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">Loading...</div>
    );
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }) =>
    isAuthenticated ? children : <Navigate to="/landing" replace />;

  return (
    <div data-theme={theme} className="min-h-screen">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/landing"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />}
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUp onRegister={handleLogin} />}
          />
          <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <ForgotPassword />
            )
          }
        />
          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <ProtectedLayout onLogout={handleLogout}><HomePage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <ProtectedLayout onLogout={handleLogout}><ExplorePage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProtectedLayout onLogout={handleLogout}><ProfilePage /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <ChatBot onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addartwork"
            element={
              <ProtectedRoute>
                <ProtectedLayout onLogout={handleLogout}><AddArtwork /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/artwork/:id"
            element={
              <ProtectedRoute>
                <ProtectedLayout onLogout={handleLogout}><ArtworkDetail /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProtectedLayout onLogout={handleLogout}><Settings onLogout={handleLogout} /></ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <ProtectedLayout onLogout={handleLogout}>
                    <DiscoverUsers />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />
          {/* Default & Catch-all */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </div>
  );
}

export default App;
