import React, { useState, useEffect } from 'react';
import { Plus, Users, Package, Calendar, Clock, Contact, Map as MapIcon } from 'lucide-react';
import api from './api';
import { format, startOfToday } from 'date-fns';
import { io } from 'socket.io-client';
import LiveTrackingMap from './LiveTrackingMap.jsx';

const Admin = () => {
    const [orders, setOrders] = useState([]);
    const [riders, setRiders] = useState([]);
    const [kids, setKids] = useState([]);
    const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
    const [showAddOrder, setShowAddOrder] = useState(false);
    const [newOrder, setNewOrder] = useState({ kid_id: '', customer_id: '' });
    const [customers, setCustomers] = useState([]);
    const [trackingOrderId, setTrackingOrderId] = useState(null);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    useEffect(() => {
        const socket = io('http://127.0.0.1:5000');
        orders.forEach(order => socket.emit('join_order', order.id));
        socket.on('status_update', (data) => {
            setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
        });
        return () => socket.disconnect();
    }, [orders.length]);

    const fetchData = async () => {
        try {
            const [ordersRes, ridersRes, kidsRes] = await Promise.all([
                api.get(`/orders?date=${selectedDate}`),
                api.get('/riders'),
                api.get('/admin/kids') // Internal admin endpoint would go here, using workaround for MVP
            ]);
            setOrders(ordersRes.data);
            setRiders(ridersRes.data);
            setKids(kidsRes.data);
        } catch (err) {
            console.error(err);
        }
        setCustomers([
            { id: 1, name: 'John Doe' },
            { id: 2, name: 'Alice Smith' },
            { id: 3, name: 'Bob Wilson' }
        ]);
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        try {
            await api.post('/orders', { ...newOrder, order_date: selectedDate });
            setShowAddOrder(false);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignRider = async (orderId, riderId) => {
        try {
            await api.put(`/orders/${orderId}`, { rider_id: riderId });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col">
                <div className="flex items-center space-x-3 mb-12">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Package className="w-7 h-7" />
                    </div>
                    <span className="font-black text-2xl tracking-tight">KidAdmin</span>
                </div>

                <nav className="flex-1 space-y-3">
                    <button className="w-full flex items-center space-x-4 bg-primary text-white p-4 rounded-2xl font-bold shadow-xl shadow-primary/10">
                        <Calendar className="w-5 h-5" />
                        <span>Daily Tracker</span>
                    </button>
                    <button className="w-full flex items-center space-x-4 text-slate-400 p-4 hover:bg-slate-50 rounded-2xl font-bold transition-all">
                        <Users className="w-5 h-5" />
                        <span>Riders Team</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-12">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 mb-2">School Deliveries</h1>
                        <p className="text-slate-400 font-bold">Manage lunch boxes for {orders.length} kids</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <input
                            type="date"
                            className="bg-white border-none shadow-sm rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary transition-all"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <button
                            onClick={() => setShowAddOrder(true)}
                            className="bg-primary text-white flex items-center space-x-3 px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New Order</span>
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                                <th className="px-10 py-6">Kid & School</th>
                                <th className="px-10 py-6">Parent</th>
                                <th className="px-10 py-6">Status</th>
                                <th className="px-10 py-6">Rider</th>
                                <th className="px-10 py-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map(order => (
                                <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${order.is_on_leave ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-black text-lg">
                                                {order.kid_name?.[0] || 'K'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800">{order.kid_name || 'Generic Kid'}</p>
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{order.school_name || 'School'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-sm font-bold text-slate-600">
                                        {order.customer_name}
                                    </td>
                                    <td className="px-10 py-8">
                                        {order.is_on_leave ? (
                                            <span className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase">On Leave</span>
                                        ) : (
                                            <span className={`text-sm font-black ${order.status === 'Delivered' ? 'text-green-600' : 'text-slate-700'}`}>{order.status}</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        {order.rider_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <Contact className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{order.rider_name}</span>
                                            </div>
                                        ) : (
                                            <select
                                                disabled={order.is_on_leave}
                                                className="bg-slate-50 border-none text-xs font-black p-3 rounded-xl focus:ring-2 focus:ring-primary w-full disabled:opacity-50"
                                                onChange={(e) => handleAssignRider(order.id, e.target.value)}
                                            >
                                                <option value="">Assign Rider</option>
                                                {riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            {order.status === 'Out for Delivery' && (
                                                <button
                                                    onClick={() => setTrackingOrderId(order.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <MapIcon className="w-3 h-3" />
                                                    Track
                                                </button>
                                            )}
                                            <button className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-primary transition-colors">Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {trackingOrderId && (
                <LiveTrackingMap
                    orderId={trackingOrderId}
                    onClose={() => setTrackingOrderId(null)}
                />
            )}

            {/* Create Order Modal */}
            {showAddOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-slide-up">
                        <h2 className="text-2xl font-bold mb-6">New Lunch Order</h2>
                        <form onSubmit={handleCreateOrder} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kid</label>
                                <select
                                    className="input-field"
                                    value={newOrder.kid_id}
                                    onChange={(e) => setNewOrder({ ...newOrder, kid_id: e.target.value })}
                                    required
                                >
                                    {kids.map(kid => <option key={kid.id} value={kid.id}>{kid.kid_name} ({kid.school_name})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer</label>
                                <select
                                    className="input-field"
                                    value={newOrder.customer_id}
                                    onChange={(e) => setNewOrder({ ...newOrder, customer_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lunch Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Veg', 'Non-Veg'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewOrder({ ...newOrder, lunch_type: type })}
                                            className={`py-3 rounded-xl font-bold border-2 transition-all ${newOrder.lunch_type === type
                                                ? 'border-primary bg-primary-light text-primary'
                                                : 'border-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddOrder(false)}
                                    className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn-primary">
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
