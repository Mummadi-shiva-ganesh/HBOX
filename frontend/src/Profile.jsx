import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Coffee, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        preferred_lunch_type: 'Veg',
        created_at: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/profile', {
                name: profile.name,
                phone: profile.phone,
                address: profile.address,
                preferred_lunch_type: profile.preferred_lunch_type
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Header */}
            <div className="bg-primary pt-12 pb-20 px-6 rounded-b-[40px] shadow-lg relative">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-12 left-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white/30">
                        <User className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
                    <p className="text-white/70 text-sm">Customer since {new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Profile Form */}
            <div className="px-6 -mt-10">
                <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 italic">
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-slate-700"
                                required
                            />
                        </div>

                        <div className="space-y-2 opacity-60">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl cursor-not-allowed font-medium text-slate-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-3 h-3" /> Phone Number
                            </label>
                            <input
                                type="tel"
                                value={profile.phone || ''}
                                placeholder="Add your phone number"
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-slate-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Delivery Address
                            </label>
                            <textarea
                                value={profile.address || ''}
                                placeholder="Enter your full address"
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-slate-700 min-h-[100px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-primary text-white font-bold py-5 rounded-[22px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
