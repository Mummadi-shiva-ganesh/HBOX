import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Package, MapPin, Clock, ChevronRight, CheckCircle, Navigation, Phone, Truck, X, Bike, Map as MapIcon, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    useEffect(() => {
        map.setView(center, map.getZoom(), { animate: true });
    }, [center, map]);
    return null;
}

// Haversine distance calculation in km
function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const Rider = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(null);
    const [currentPos, setCurrentPos] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [socket, setSocket] = useState(null);
    const watchIdRef = useRef(null);
    const currentPosRef = useRef(null);
    const socketRef = useRef(null);

    // Keep refs in sync
    useEffect(() => {
        currentPosRef.current = currentPos;
    }, [currentPos]);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://127.0.0.1:5000';
        const newSocket = io(socketUrl);
        setSocket(newSocket);
        fetchDeliveries();

        // Use watchPosition for continuous live GPS tracking
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const newPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentPos(newPos);
                    setLocationError(null);
                },
                (error) => {
                    console.error("GPS Error:", error);
                    setLocationError("Unable to get your location. Please enable GPS.");
                    // Fallback to a default position if GPS fails
                    if (!currentPosRef.current) {
                        setCurrentPos({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 2000
                }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
            setCurrentPos({ lat: 12.9716, lng: 77.5946 });
        }

        return () => {
            newSocket.disconnect();
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
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
                startLiveLocationEmit(orderId);
            }

            if (socketRef.current) {
                socketRef.current.emit('update_status', { orderId, status });
            }
            fetchDeliveries();
        } catch (err) {
            console.error(err);
        }
    };

    // Emit the rider's REAL GPS location to the customer every 3 seconds
    const startLiveLocationEmit = useCallback((orderId) => {
        const activeDelivery = deliveries.find(d => d.id === orderId);
        if (!activeDelivery) return;

        const interval = setInterval(() => {
            const pos = currentPosRef.current;
            const sock = socketRef.current;
            if (!pos || !sock) return;

            const destLat = activeDelivery.school_lat;
            const destLng = activeDelivery.school_lng;

            // Calculate real distance and ETA
            const distKm = getDistanceKm(pos.lat, pos.lng, destLat, destLng);
            const distStr = distKm < 1 ? `${(distKm * 1000).toFixed(0)} m` : `${distKm.toFixed(1)} km`;
            // Assume avg speed of 20 km/h for city delivery
            const etaMinutes = Math.max(1, Math.round((distKm / 20) * 60));
            const etaStr = etaMinutes <= 1 ? '1 min' : `${etaMinutes} mins`;

            sock.emit('update_location', {
                orderId,
                riderId: user.id,
                lat: pos.lat,
                lng: pos.lng,
                destLat,
                destLng,
                timestamp: new Date().toISOString(),
                distance: distStr,
                eta: etaStr
            });
        }, 3000);

        // Stop emitting after 30 minutes max
        setTimeout(() => clearInterval(interval), 30 * 60 * 1000);

        return () => clearInterval(interval);
    }, [deliveries, user.id]);

    // Open Google Maps with rider's current position as origin and school as destination
    const openNavigation = (delivery) => {
        const pos = currentPosRef.current;
        let url;
        const searchInput = `${delivery.school_name}, ${delivery.school_address}`;
        const encodedDestination = encodeURIComponent(searchInput);
        
        if (pos && pos.lat) {
            url = `https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${encodedDestination}&travelmode=driving`;
        } else {
            url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving`;
        }
        if (url) window.open(url, '_blank');
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

    if (loading || !currentPos) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            {!currentPos && <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Getting your location...</p>}
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
                            <div className={`w-2 h-2 rounded-full animate-pulse ${locationError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                {locationError ? 'GPS Issue' : 'Active & Online'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/rider/profile')}
                            className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <UserCircle className="w-6 h-6 text-gray-400" />
                        </button>
                        <button
                            onClick={logout}
                            className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <LogOut className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* GPS Error Banner */}
                {locationError && (
                    <div className="mx-6 mt-4 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 text-sm font-bold text-center">
                        {locationError}
                    </div>
                )}

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
                                        {/* Show distance to destination */}
                                        {delivery.school_lat && currentPos && (
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Navigation className="w-4 h-4 text-blue-400" />
                                                        <p className="text-sm font-bold text-gray-300">
                                                            {(() => {
                                                                if (!currentPos || !currentPos.lat || !delivery.school_lat) return 'Calculating...';
                                                                const d = getDistanceKm(currentPos.lat, currentPos.lng, delivery.school_lat, delivery.school_lng);
                                                                return d < 1 ? `${(d * 1000).toFixed(0)} m away` : `${d.toFixed(1)} km away`;
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => openNavigation(delivery)}
                                                        className="text-blue-400 text-xs font-bold underline underline-offset-2"
                                                    >
                                                        Navigate
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={() => updateStatus(delivery.id, 'Out for Delivery')}
                                                        className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-3 transition-all active:scale-95"
                                                    >
                                                        <Navigation className="w-5 h-5 fill-current" />
                                                        <span>Start Delivery</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openNavigation(delivery)}
                                                        className="w-full bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <img src="https://www.gstatic.com/images/branding/product/2x/maps_96dp.png" className="w-5 h-5" alt="Google Maps" />
                                                        <span>Open in Google Maps</span>
                                                    </button>
                                                </div>
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
                                                        onClick={() => openNavigation(delivery)}
                                                        className="w-full bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/10"
                                                    >
                                                        <img src="https://www.gstatic.com/images/branding/product/2x/maps_96dp.png" className="w-5 h-5" alt="Google Maps" />
                                                        <span>Navigate with Google Maps</span>
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
                                {currentPos && showMap.school_lat && (
                                    <p className="text-blue-400 text-xs font-bold mt-1">
                                        {(() => {
                                            if (!currentPos || !currentPos.lat || !showMap.school_lat) return 'Calculating...';
                                            const d = getDistanceKm(currentPos.lat, currentPos.lng, showMap.school_lat, showMap.school_lng);
                                            return d < 1 ? `${(d * 1000).toFixed(0)} m away` : `${d.toFixed(1)} km away`;
                                        })()}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowMap(null)}
                                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            <MapContainer center={[currentPos.lat, currentPos.lng]} zoom={15} className="h-full w-full grayscale contrast-[1.2]">
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />

                                <Marker position={[currentPos.lat, currentPos.lng]} icon={riderIcon}>
                                    <Popup>You are here</Popup>
                                </Marker>

                                {showMap.school_lat && (
                                    <>
                                        <Marker position={[showMap.school_lat, showMap.school_lng]} icon={schoolIcon}>
                                            <Popup>{showMap.school_name}</Popup>
                                        </Marker>
                                        <Polyline
                                            positions={[
                                                [currentPos.lat, currentPos.lng],
                                                [showMap.school_lat, showMap.school_lng]
                                            ]}
                                            color="#276EF1"
                                            weight={6}
                                            opacity={0.8}
                                            dashArray="12 8"
                                        />
                                    </>
                                )}
                                <ChangeView center={[currentPos.lat, currentPos.lng]} />
                            </MapContainer>

                            {/* Floating Action Bar */}
                            <div className="absolute bottom-12 left-6 right-6 z-[1000] animate-uber-slide-up lg:w-96 lg:left-1/2 lg:-translate-x-1/2">
                                <button
                                    onClick={() => openNavigation(showMap)}
                                    className="w-full bg-white text-black font-black py-6 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-100"
                                >
                                    <img src="https://www.gstatic.com/images/branding/product/2x/maps_96dp.png" className="w-6 h-6" alt="Google Maps" />
                                    <span>Navigate with Google Maps</span>
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
