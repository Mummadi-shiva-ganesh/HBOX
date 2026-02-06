import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package2, Mail, User, Lock, ChevronRight, ArrowLeft } from 'lucide-react';

const Register = () => {
    const { state } = useLocation();
    const [formData, setFormData] = useState({
        name: state?.googleInfo?.name || '',
        email: state?.googleInfo?.email || '',
        password: '',
        role: 'customer',
        google_id: state?.googleInfo?.google_id || null,
        avatar: state?.googleInfo?.avatar || null
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.role,
                null,
                formData.google_id
            );
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'rider') navigate('/rider');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white sm:bg-gray-50">
            <div className="w-full max-w-md bg-white sm:rounded-[40px] sm:shadow-2xl sm:p-12 sm:border sm:border-gray-100 overflow-hidden relative">
                {/* Header / Brand */}
                <div className="p-8 pt-12 sm:p-0 flex flex-col items-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="absolute top-12 left-8 sm:top-12 sm:left-12 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                        <Package2 className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-black">Create Account</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Join the HBOX Fleet</p>
                </div>

                <div className="flex-1 px-8 pb-12 sm:px-0 sm:pb-0 w-full mt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                className="uber-input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                className={`uber-input ${formData.google_id ? 'opacity-50' : ''}`}
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={!!formData.google_id}
                            />
                        </div>

                        {!formData.google_id && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    className="uber-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">You are a...</label>
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'customer' })}
                                    className={`flex-1 py-3 px-4 rounded-xl font-black transition-all text-xs tracking-wider uppercase ${formData.role === 'customer' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
                                >
                                    Parent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'rider' })}
                                    className={`flex-1 py-3 px-4 rounded-xl font-black transition-all text-xs tracking-wider uppercase ${formData.role === 'rider' ? 'bg-white text-black shadow-md' : 'text-gray-400'}`}
                                >
                                    Rider
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

                        <button type="submit" className="uber-btn-black w-full bg-black hover:bg-gray-900 border-none !py-4 mt-4 justify-center">
                            <span>Get Started</span>
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-gray-400 font-medium">
                            Already have an account? <span className="text-black font-black cursor-pointer underline underline-offset-4" onClick={() => navigate('/login')}>Sign In</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
