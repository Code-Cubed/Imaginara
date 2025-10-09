import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Assuming your main App component passes a login handler via props/context
const OAuthCallback = ({ onLogin }) => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const token = query.get('token');
        const error = query.get('error');

        if (error) {
            // Handle error redirected from backend failure route
            console.error("OAuth Failed:", error);
            navigate('/login?error=OAuth failed. Please try again.', { replace: true });
        } else if (token) {
            // Successful login: save token and redirect
            localStorage.setItem('token', token);
            onLogin?.(); // Call the global state update function
            navigate('/home', { replace: true });
        } else {
            // No token and no explicit error
            navigate('/login?error=Invalid OAuth response', { replace: true });
        }
    }, [location, navigate, onLogin]);

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Completing Secure Login...</h2>
            <p>Please wait, you are being redirected.</p>
        </div>
    );
};

export default OAuthCallback;