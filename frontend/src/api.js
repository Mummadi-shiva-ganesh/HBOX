import axios from 'axios';

const isProd = import.meta.env.MODE === 'production';
const api = axios.create({
    baseURL: isProd ? '/api' : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
