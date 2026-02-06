import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Clock, Navigation, Bike, MapPin, ChevronUp } from 'lucide-react';

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

const LiveTrackingMap = ({ orderId, onClose }) => {
    const [location, setLocation] = useState(null);

    useEffect(() => {
        const socket = io('http://127.0.0.1:5000');
        socket.emit('join_order', orderId);

        socket.on('location_update', (data) => {
            if (data.orderId === orderId) {
                setLocation(data);
            }
        });

        return () => socket.disconnect();
    }, [orderId]);

    const riderIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/711/711701.png',
        iconSize: [45, 45],
        iconAnchor: [22, 22]
    });

    const schoolIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2800/2800263.png',
        iconSize: [45, 45],
        iconAnchor: [22, 45]
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end justify-center animate-uber-fade-in sm:items-center sm:p-6">
            <div className="bg-white w-full h-[92vh] sm:h-[85vh] sm:max-w-4xl sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl relative flex flex-col sm:border sm:border-white/20">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 z-[120] w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-xl border border-gray-100 hover:scale-110 active:scale-95 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Floating Stats Header - Desktop */}
                {location && (
                    <div className="hidden sm:block absolute top-6 right-6 left-24 z-[110] animate-uber-slide-up max-w-sm ml-auto">
                        <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/20 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 leading-none">Arrival In</p>
                                <p className="text-xl font-black text-black">{location.eta}</p>
                            </div>
                            <div className="w-[1px] h-8 bg-gray-100 mx-4"></div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 leading-none">Distance</p>
                                <p className="text-xl font-black text-blue-600">{location.distance}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 w-full relative z-10">
                    {location ? (
                        <MapContainer center={[location.lat, location.lng]} zoom={15} className="h-full w-full grayscale contrast-[1.1]">
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />

                            <Marker position={[location.lat, location.lng]} icon={riderIcon}>
                                <Popup>Your Lunch Box is here!</Popup>
                            </Marker>

                            {location.destLat && location.destLng && (
                                <>
                                    <Marker
                                        position={[location.destLat, location.destLng]}
                                        icon={schoolIcon}
                                    />
                                    <Polyline
                                        positions={[
                                            [location.lat, location.lng],
                                            [location.destLat, location.destLng]
                                        ]}
                                        color="#276EF1"
                                        weight={6}
                                        opacity={0.8}
                                    />
                                </>
                            )}
                            <ChangeView center={[location.lat, location.lng]} />
                        </MapContainer>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50">
                            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Finding Rider...</p>
                        </div>
                    )}
                </div>

                {/* Uber-style Bottom Sheet - Responsive */}
                {location && (
                    <div className="bg-white px-8 pt-6 pb-12 sm:pb-6 relative z-20 animate-uber-slide-up sm:absolute sm:bottom-6 sm:left-6 sm:right-6 sm:max-w-md sm:rounded-3xl sm:shadow-2xl sm:border sm:border-gray-100">
                        {/* Mobile Handle */}
                        <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-6 sm:hidden"></div>

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white">
                                    <Bike className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-black leading-tight">On the move</h3>
                                    <p className="text-gray-500 font-medium text-sm">Your rider is delivering to school</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Stats (Only visible on mobile) */}
                        <div className="grid grid-cols-2 gap-4 mb-6 sm:hidden">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">ETA</p>
                                <p className="text-lg font-black">{location.eta}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Distance</p>
                                <p className="text-lg font-black text-blue-600">{location.distance}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-6 rounded-2xl flex items-center gap-5 border border-gray-100">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Navigation className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Current Stop</p>
                                    <p className="font-black text-black">Heading to {location.schoolName || 'St. Mary School'}</p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full uber-btn-black py-5 !rounded-2xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveTrackingMap;
