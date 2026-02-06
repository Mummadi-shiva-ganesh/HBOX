import React, { useState } from 'react';
import { Baby, School, MapPin, Phone, Home, ArrowRight, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from './api';

const AddKid = () => {
    const navigate = useNavigate();
    const [kid, setKid] = useState({
        kid_name: '',
        school_name: '',
        school_address: '',
        parent_phone: '',
        delivery_address: '',
        school_lat: null,
        school_lng: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Demo Logic: Assign random coordinates near Bangalore center if not provided
        const finalKid = {
            ...kid,
            school_lat: kid.school_lat || (12.9716 + (Math.random() - 0.5) * 0.05),
            school_lng: kid.school_lng || (77.5946 + (Math.random() - 0.5) * 0.05)
        };

        try {
            await api.post('/kids', finalKid);
            navigate('/');
        } catch (err) {
            setError('Failed to add lunch box. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-primary/20">
                        <Baby className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Register Lunch Box</h1>
                    <p className="text-slate-500">Add your child's details to start tracking their lunch.</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Baby className="w-3 h-3" /> Child's Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Aryan Sharma"
                                value={kid.kid_name}
                                onChange={(e) => setKid({ ...kid, kid_name: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <School className="w-3 h-3" /> School Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. St. Xavier's High School"
                                value={kid.school_name}
                                onChange={(e) => setKid({ ...kid, school_name: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> School Address
                            </label>
                            <textarea
                                placeholder="Full address of the school"
                                value={kid.school_address}
                                onChange={(e) => setKid({ ...kid, school_address: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium min-h-[80px]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-3 h-3" /> Parent Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="Emergency contact number"
                                value={kid.parent_phone}
                                onChange={(e) => setKid({ ...kid, parent_phone: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Home className="w-3 h-3" /> Home Address
                            </label>
                            <textarea
                                placeholder="Primary delivery address"
                                value={kid.delivery_address}
                                onChange={(e) => setKid({ ...kid, delivery_address: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium min-h-[80px]"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white font-black py-5 rounded-[22px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span>Complete Registration</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddKid;
