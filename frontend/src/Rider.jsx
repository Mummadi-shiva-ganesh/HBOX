import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, ChevronRight, CheckCircle, Navigation, Phone, Truck, X, Bike, Map as MapIcon, LogOut } from 'lucide-react';
import api from './api';
import { useAuth } from './AuthContext.jsx';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
    const map = useMap();
    map.setView(center);
    return null;
}

const Rider = () => {
    const { user, logout } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(null);
    const [currentPos, setCurrentPos] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://127.0.0.1:5000';
        const newSocket = io(socketUrl);
        setSocket(newSocket);
        fetchDeliveries();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setCurrentPos({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            });
        }

        return () => newSocket.disconnect();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const response = await api.get(`/orders?role=rider&userId=${user.id}`);
            setDeliveries(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            const body = { status };
            if (status === 'Accepted') body.rider_id = user.id;
            await api.put(`/orders/${orderId}`, body);

            if (status === 'Out for Delivery') {
                startLocationSimulation(orderId);
            }

            socket.emit('update_status', { orderId, status });
            fetchDeliveries();
        } catch (err) {
            console.error(err);
        }
    };

    const startLocationSimulation = (orderId) => {
        let count = 0;
        const activeDelivery = deliveries.find(d => d.id === orderId);
        if (!activeDelivery) return;

        const interval = setInterval(() => {
            if (deliveries.find(d => d.id === orderId)?.status !== 'Out for Delivery' && count > 0) {
                clearInterval(interval);
                return;
            }

            const newPos = {
                lat: currentPos.lat + (count * 0.0005),
                lng: currentPos.lng + (count * 0.0005)
            };

            setCurrentPos(newPos);
            socket.emit('update_location', {
                orderId,
                riderId: user.id,
                lat: newPos.lat,
                lng: newPos.lng,
                destLat: activeDelivery.school_lat,
                destLng: activeDelivery.school_lng,
                timestamp: new Date().toISOString(),
                distance: "0.8 km",
                eta: "4 mins"
            });
            count++;
            if (count > 50) clearInterval(interval);
        }, 3000);
    };

    const openNavigation = (delivery) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.school_lat},${delivery.school_lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    const riderIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/711/711701.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const schoolIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2800/2800263.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white pb-32">
            <div className="max-w-7xl mx-auto">
                {/* Uber Driver Header */}
                <div className="px-6 pt-16 pb-8 bg-black border-b border-white/10 sticky top-0 z-30 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">HBOX Pilot</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Active & Online</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <LogOut className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Daily Stats - Flexible Grid */}
                <div className="px-6 mt-8">
                    <div className="bg-white/5 rounded-[24px] p-6 border border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="border-r border-white/10 pr-4">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 leading-none">Deliveries</p>
                            <p className="text-2xl font-black">{deliveries.length}</p>
                        </div>
                        <div className="pl-4 border-r-0 lg:border-r border-white/10">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 leading-none">Earnings</p>
                            <p className="text-2xl font-black text-blue-500">₹ {(deliveries.filter(d => d.status === 'Delivered').length * 40).toFixed(0)}</p>
                        </div>
                        {/* Desktop only extra stats */}
                        <div className="hidden lg:block pl-4 border-r border-white/10">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 leading-none">Time Online</p>
                            <p className="text-2xl font-black text-white">4h 12m</p>
                        </div>
                        <div className="hidden lg:block pl-4">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 leading-none">Rating</p>
                            <p className="text-2xl font-black text-yellow-500">4.9 ★</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Feed - Responsive Grid */}
                <div className="px-6 mt-8">
                    {deliveries.length === 0 ? (
                        <div className="bg-white/5 rounded-[40px] p-16 text-center border border-dashed border-white/10">
                            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No school orders available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deliveries.map(delivery => (
                                <div key={delivery.id} className="bg-white/5 rounded-[32px] p-6 border border-white/10 relative overflow-hidden group h-fit">
                                    {delivery.status === 'Delivered' && (
                                        <div className="absolute top-4 right-4 animate-uber-fade-in">
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                                            <Package className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black">{delivery.kid_name}</h2>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{delivery.school_name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 mb-6">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <p className="text-sm font-bold text-gray-300 truncate">{delivery.school_address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {delivery.status !== 'Delivered' && (
                                        <div className="space-y-3">
                                            {delivery.status === 'Packed' && (
                                                <button
                                                    onClick={() => updateStatus(delivery.id, 'Accepted')}
                                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                                                >
                                                    Accept Request
                                                </button>
                                            )}
                                            {delivery.status === 'Accepted' && (
                                                <button
                                                    onClick={() => updateStatus(delivery.id, 'Picked Up')}
                                                    className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all active:scale-95"
                                                >
                                                    Mark as Picked Up
                                                </button>
                                            )}
                                            {delivery.status === 'Picked Up' && (
                                                <button
                                                    onClick={() => updateStatus(delivery.id, 'Out for Delivery')}
                                                    className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-3 transition-all active:scale-95"
                                                >
                                                    <Navigation className="w-5 h-5 fill-current" />
                                                    <span>Start Navigation</span>
                                                </button>
                                            )}
                                            {delivery.status === 'Out for Delivery' && (
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => setShowMap(delivery)}
                                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-3 transition-all active:scale-95"
                                                    >
                                                        <MapIcon className="w-5 h-5" />
                                                        <span>In-App Tracking</span>
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(delivery.id, 'Delivered')}
                                                        className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-5 rounded-2xl transition-all active:scale-95"
                                                    >
                                                        Confirm Delivery
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Modal Overlay - Responsive */}
            {showMap && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-uber-fade-in lg:items-center lg:justify-center lg:bg-black/90 lg:backdrop-blur-sm">
                    <div className="flex flex-col h-full w-full lg:max-w-4xl lg:h-[80vh] lg:bg-black lg:rounded-3xl lg:overflow-hidden lg:border lg:border-white/10 lg:shadow-2xl">
                        <div className="px-6 pt-16 lg:pt-6 pb-6 border-b border-white/10 flex justify-between items-center bg-black sticky top-0 z-[110]">
                            <div>
                                <h3 className="text-xl font-black">{showMap.school_name}</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{showMap.school_address}</p>
                            </div>
                            <button
                                onClick={() => setShowMap(null)}
                                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            <MapContainer center={[currentPos.lat, currentPos.lng]} zoom={14} className="h-full w-full grayscale contrast-[1.2]">
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />

                                <Marker position={[currentPos.lat, currentPos.lng]} icon={riderIcon} />

                                {showMap.school_lat && (
                                    <>
                                        <Marker position={[showMap.school_lat, showMap.school_lng]} icon={schoolIcon} />
                                        <Polyline
                                            positions={[
                                                [currentPos.lat, currentPos.lng],
                                                [showMap.school_lat, showMap.school_lng]
                                            ]}
                                            color="#276EF1"
                                            weight={6}
                                            opacity={0.8}
                                        />
                                    </>
                                )}
                                <ChangeView center={[currentPos.lat, currentPos.lng]} />
                            </MapContainer>

                            {/* Floating Action Bar */}
                            <div className="absolute bottom-12 left-6 right-6 z-[1000] animate-uber-slide-up lg:w-96 lg:left-1/2 lg:-translate-x-1/2">
                                <button
                                    onClick={() => openNavigation(showMap)}
                                    className="w-full bg-black text-white border-2 border-white/10 font-black py-6 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-900"
                                >
                                    <Navigation className="w-6 h-6 text-blue-500" />
                                    <span>Switch to Google Maps</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rider;
