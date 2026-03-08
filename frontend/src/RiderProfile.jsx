import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, ArrowLeft, Bike, Star, Package, Clock, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import api from './api';

const RiderProfile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        created_at: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [deliveryCount, setDeliveryCount] = useState(0);

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile');
            setProfile(response.data);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(`/orders?role=rider&userId=${user.id}`);
            setDeliveryCount(response.data.length);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/profile', {
                name: profile.name,
                phone: profile.phone,
                address: profile.address,
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const delivered = deliveryCount;
    const earnings = (delivered * 40);
    const memberSince = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

    return (
        <div className="min-h-screen bg-black text-white pb-16">
            {/* Header */}
            <div className="px-6 pt-16 pb-8 bg-black border-b border-white/10 sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/rider')}
                        className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-black tracking-tight">Pilot Profile</h1>
                    <div className="w-12 h-12"></div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Avatar & Name Section */}
                <div className="px-6 pt-10 pb-8 flex flex-col items-center">
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center mb-5 shadow-2xl shadow-blue-600/30 border-4 border-blue-500/20">
                        <User className="w-14 h-14 text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{profile.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">HBOX Pilot {memberSince ? `since ${memberSince}` : ''}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="px-6 mb-8">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 rounded-[20px] p-5 border border-white/5 text-center">
                            <Package className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                            <p className="text-xl font-black">{delivered}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Deliveries</p>
                        </div>
                        <div className="bg-white/5 rounded-[20px] p-5 border border-white/5 text-center">
                            <Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                            <p className="text-xl font-black">4.9</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Rating</p>
                        </div>
                        <div className="bg-white/5 rounded-[20px] p-5 border border-white/5 text-center">
                            <Clock className="w-5 h-5 text-green-500 mx-auto mb-2" />
                            <p className="text-xl font-black">₹{earnings}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Earned</p>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div className="px-6 mb-4">
                        <div className={`p-4 rounded-2xl text-sm font-bold text-center ${message.type === 'success'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Profile Form */}
                <div className="px-6">
                    <form onSubmit={handleUpdate} className="space-y-5">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User className="w-3 h-3" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all font-bold text-white placeholder-gray-600"
                                required
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div className="space-y-2 opacity-50">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Mail className="w-3 h-3" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl cursor-not-allowed font-bold text-gray-500"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Phone className="w-3 h-3" /> Phone Number
                            </label>
                            <input
                                type="tel"
                                value={profile.phone || ''}
                                placeholder="Add your phone number"
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all font-bold text-white placeholder-gray-600"
                            />
                        </div>

                        {/* Address / Hub */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Base Hub / Address
                            </label>
                            <textarea
                                value={profile.address || ''}
                                placeholder="Enter your base hub or address"
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all font-bold text-white placeholder-gray-600 min-h-[100px] resize-none"
                            />
                        </div>

                        {/* Vehicle Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Bike className="w-3 h-3" /> Vehicle Type
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Bike', 'Scooter', 'Car'].map((type) => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setProfile({ ...profile, vehicle_type: type })}
                                        className={`py-4 rounded-2xl font-bold text-sm transition-all border ${profile.vehicle_type === type
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 mt-4"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Logout Section */}
                    <div className="mt-10 mb-8">
                        <button
                            onClick={logout}
                            className="w-full bg-white/5 border border-white/10 text-red-400 font-bold py-4 rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderProfile;
