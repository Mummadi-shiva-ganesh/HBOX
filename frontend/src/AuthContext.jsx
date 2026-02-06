import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [loading, setLoading] = useState(false);

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
        const { signInWithPopup, auth, googleProvider } = await import('./firebase');
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
            console.error("Google Login Backend Error", err);
            throw err;
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
