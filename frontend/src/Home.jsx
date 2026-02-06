import React, { useState, useEffect } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import { Package, MapPin, Clock, ChevronRight, User, Phone, Bike, Map as MapIcon, X, Baby, Calendar, LogOut, Plus } from 'lucide-react';
import api from './api';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import LiveTrackingMap from './LiveTrackingMap.jsx';

const Home = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
    const [kids, setKids] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trackingOrderId, setTrackingOrderId] = useState(null);
    const { user, logout } = useAuth();

    const dates = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));

    useEffect(() => {
        const initializeHome = async () => {
            setLoading(true);
            try {
                const kidsRes = await api.get('/kids');
                if (kidsRes.data.length === 0) {
                    navigate('/add-kid');
                    return;
                }
                setKids(kidsRes.data);
                fetchOrders();
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        initializeHome();
    }, [selectedDate]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://127.0.0.1:5000';
        const socket = io(socketUrl);
        orders.forEach(order => socket.emit('join_order', order.id));
        socket.on('status_update', (data) => {
            setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
        });
        return () => socket.disconnect();
    }, [orders]);

    const fetchOrders = async () => {
        try {
            const response = await api.get(`/orders?date=${selectedDate}&role=customer&userId=${user.id}`);
            setOrders(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkLeave = async (kidId) => {
        const leaveDate = format(addDays(new Date(selectedDate), 0), 'yyyy-MM-dd');
        if (!window.confirm(`Are you sure you want to mark leave for ${leaveDate}?`)) return;
        try {
            await api.post('/leaves', { kid_id: kidId, leave_date: leaveDate });
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to mark leave');
        }
    };

    const handleOrderNow = async (kidId) => {
        try {
            await api.post('/orders', {
                customer_id: user.id,
                kid_id: kidId,
                order_date: selectedDate
            });
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to place order');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-32">
            <div className="max-w-7xl mx-auto">
                {/* Uber-style Header */}
                <div className="px-6 pt-16 pb-6 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-30">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">HBOX Kids</h1>
                        <p className="text-gray-500 font-medium text-sm mt-1">Smart lunch tracking</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/add-kid')}
                            className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                            <User className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Uber-style Date Selector */}
                <div className="bg-white px-6 py-4 sticky top-[108px] z-20 border-b border-gray-50">
                    <div className="flex space-x-3 overflow-x-auto hide-scrollbar sm:justify-center">
                        {dates.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isSelected = selectedDate === dateStr;
                            const isToday = dateStr === format(startOfToday(), 'yyyy-MM-dd');

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`flex flex-col items-center min-w-[65px] h-[85px] justify-center rounded-[18px] transition-all duration-300 ${isSelected
                                        ? 'bg-black text-white shadow-xl translate-y-[-2px]'
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {isToday ? 'Today' : format(date, 'EEE')}
                                    </span>
                                    <span className="text-xl font-black mt-1">
                                        {format(date, 'dd')}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* List of Kids / Orders */}
                <div className="px-6 mt-8 space-y-6 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:space-y-0">
                    {kids.map(kid => {
                        const order = orders.find(o => o.kid_id === kid.id);
                        const isOutForDelivery = order?.status === 'Out for Delivery';

                        return (
                            <div key={kid.id} className="uber-card p-6 relative overflow-hidden group h-fit">
                                {order?.is_on_leave && (
                                    <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center text-center p-6 animate-uber-fade-in backdrop-blur-sm">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-black">Optional Day</h3>
                                        <p className="text-gray-500 text-sm mt-1 font-medium">No deliveries planned for today</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-gray-100 transition-colors">
                                            <Baby className="w-8 h-8 text-black" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight">{kid.kid_name}</h2>
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{kid.school_name}</p>
                                        </div>
                                    </div>
                                    {order ? (
                                        <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {order.status}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOrderNow(kid.id)}
                                                className="px-5 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                                            >
                                                Order Now
                                            </button>
                                            <button
                                                onClick={() => handleMarkLeave(kid.id)}
                                                className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                            >
                                                Leave
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {order && (
                                    <div className="space-y-6">
                                        {/* Uber Tracker Line */}
                                        <div className="flex items-center gap-2 px-1">
                                            {['Packed', 'Accepted', 'Picked Up', 'Out for Delivery', 'Delivered'].map((s, idx) => {
                                                const statuses = ['Packed', 'Accepted', 'Picked Up', 'Out for Delivery', 'Delivered'];
                                                const currentIndex = statuses.indexOf(order.status);
                                                const isActive = currentIndex >= idx;
                                                const isCompleted = currentIndex > idx;

                                                return (
                                                    <React.Fragment key={s}>
                                                        <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isActive ? 'bg-black' : 'bg-gray-100'}`} />
                                                        {idx < 4 && (
                                                            <div className="flex-1 h-[2px] bg-gray-100 overflow-hidden">
                                                                <div className={`h-full transition-all duration-1000 ${isCompleted ? 'w-full bg-black' : 'w-0'}`} />
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>

                                        {/* Status Card */}
                                        {isOutForDelivery && (
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-uber-slide-up">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white">
                                                            <Bike className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-black leading-tight">{order.rider_name || 'Your Rider'}</p>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">En route to school</p>
                                                        </div>
                                                    </div>
                                                    <a href={`tel:${order.rider_phone}`} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                                        <Phone className="w-5 h-5" />
                                                    </a>
                                                </div>

                                                <button
                                                    onClick={() => setTrackingOrderId(order.id)}
                                                    className="w-full mt-4 bg-white border-2 border-black text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
                                                >
                                                    <MapIcon className="w-5 h-5" />
                                                    <span>Track on Map</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Order Meta */}
                                        {!isOutForDelivery && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-50">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Expected By</p>
                                                    <p className="text-sm font-black text-black">{order.estimated_time || '12:45 PM'}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-50 flex flex-col items-end">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 text-right">Delivery To</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-black" />
                                                        <p className="text-sm font-black text-black">School</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Uber-style Bottom Navigation - Centered on desktop */}
            <div className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto h-20 bg-black rounded-[28px] shadow-2xl flex items-center justify-around px-4 pointer-events-auto cursor-pointer border border-gray-800">
                    <button className="text-white flex flex-col items-center gap-1 group">
                        <Package className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-100">Deliveries</span>
                    </button>
                    <button
                        onClick={() => navigate('/add-kid')}
                        className="text-gray-500 hover:text-white transition-colors flex flex-col items-center gap-1 group"
                    >
                        <Baby className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60 group-hover:opacity-100">Kids</span>
                    </button>
                    <button
                        onClick={logout}
                        className="text-gray-500 hover:text-white transition-colors flex flex-col items-center gap-1 group"
                    >
                        <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60 group-hover:opacity-100">Logout</span>
                    </button>
                </div>
            </div>

            {trackingOrderId && (
                <LiveTrackingMap
                    orderId={trackingOrderId}
                    onClose={() => setTrackingOrderId(null)}
                />
            )}
        </div>
    );
};

export default Home;
