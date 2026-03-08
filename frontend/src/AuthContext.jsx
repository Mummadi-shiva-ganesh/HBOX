import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize user from localStorage on mount
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('token');
            if (savedUser && savedToken) {
                const parsed = JSON.parse(savedUser);
                // Validate that parsed user has required fields
                if (parsed && parsed.id && parsed.role) {
                    setUser(parsed);
                } else {
                    // Invalid user data, clear it
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
        } catch (e) {
            console.error("Error parsing user from localStorage:", e);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return response.data.user;
    };

    const register = async (name, email, password, role, phone, google_id) => {
        const response = await api.post('/auth/register', { name, email, password, role, phone, google_id });
        // Automatically login after registration
        return await login(email, password);
    };

    const googleLogin = async () => {
        try {
            const { signInWithPopup, auth, googleProvider } = await import('./firebase');
            
            // Check if Firebase is properly configured
            if (!auth || !googleProvider) {
                throw new Error('Firebase not configured properly');

            }

            const result = await signInWithPopup(auth, googleProvider);
            const { email, displayName, uid, photoURL } = result.user;

            try {
                const response = await api.post('/auth/login', { google_id: uid });

                if (response.data.newUser) {
                    // If new user, we need to register them. 
                    // We'll return the google info so the UI can prompt for more or just auto-register.
                    return { newUser: true, googleInfo: { email, name: displayName, google_id: uid, avatar: photoURL } };
                }

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setUser(response.data.user);
                return response.data.user;
            } catch (err) {
                console.error("Google Login Backend Error:", err);
                throw new Error('Backend authentication failed');
            }
        } catch (err) {
            console.error("Google Login Error:", err);
            if (err.code === 'auth/configuration-not-found' || err.message?.includes('Firebase')) {
                throw new Error('Firebase is not configured. Please set up Firebase credentials in firebase.js');
            }
            if (err.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign-in popup was closed');
            }
            if (err.code === 'auth/cancelled-popup-request') {
                throw new Error('Sign-in was cancelled');
            }
            // Pass the specific error message from backend if available
            throw new Error(err?.response?.data?.error || err.message || 'Google sign-in failed');

        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, googleLogin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
