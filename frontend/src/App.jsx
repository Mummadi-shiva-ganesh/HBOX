import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './Login.jsx';
import Home from './Home.jsx';
import Admin from './Admin.jsx';
import Rider from './Rider.jsx';
import Profile from './Profile.jsx';
import AddKid from './AddKid.jsx';
import Register from './Register.jsx';

const PrivateRoute = ({ children, roles }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <PrivateRoute roles={['customer']}>
                            <Home />
                        </PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute roles={['customer']}>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/add-kid" element={
                        <PrivateRoute roles={['customer']}>
                            <AddKid />
                        </PrivateRoute>
                    } />
                    <Route path="/admin" element={
                        <PrivateRoute roles={['admin']}>
                            <Admin />
                        </PrivateRoute>
                    } />
                    <Route path="/rider" element={
                        <PrivateRoute roles={['rider']}>
                            <Rider />
                        </PrivateRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App;
