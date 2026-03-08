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
import RiderProfile from './RiderProfile.jsx';
import { Toaster } from 'react-hot-toast';

// Error Boundary to catch rendering crashes
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error("App crashed:", error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Something went wrong</h1>
                    <p style={{ color: '#666' }}>{this.state.error?.message}</p>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        style={{ padding: '12px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Clear Data & Restart
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
                    <p style={{ color: '#666', fontWeight: 500 }}>Loading HBOX...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '100px', fontWeight: 'bold' } }} />
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
                        <Route path="/rider/profile" element={
                            <PrivateRoute roles={['rider']}>
                                <RiderProfile />
                            </PrivateRoute>
                        } />
                        <Route path="*" element={
                            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                                <h1 className="text-8xl font-black text-gray-200">404</h1>
                                <p className="text-xl font-bold mt-4">Page not found</p>
                                <p className="text-gray-500 mt-2 mb-8">The route you are looking for doesn't exist.</p>
                                <a href="/" className="px-8 py-4 bg-black text-white font-bold rounded-full hover:scale-105 transition-transform">Go Home</a>
                            </div>
                        } />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App;
