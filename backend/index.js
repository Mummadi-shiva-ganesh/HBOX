require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDb } = require('./database');

// Rate limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const { login, register, authenticate, authorize } = require('./auth');
const { createOrder, getOrders, updateOrderStatus } = require('./orders');
const { getProfile, updateProfile } = require('./profile');
const { getKids, addKid, updateKid, getAllKids } = require('./kids');
const { markLeave, getLeaves } = require('./leaves');

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for local dev/React scripts. You can strict this in real prod.
}));
app.use(express.json());

// Routes
app.post('/api/auth/register', authLimiter, register);
app.post('/api/auth/login', authLimiter, login);

app.get('/api/orders', authenticate, getOrders);
app.post('/api/orders', authenticate, authorize(['admin', 'customer']), createOrder);
app.put('/api/orders/:id', authenticate, updateOrderStatus);

app.get('/api/profile', authenticate, getProfile);
app.put('/api/profile', authenticate, updateProfile);

app.get('/api/kids', authenticate, getKids);
app.post('/api/kids', authenticate, addKid);
app.put('/api/kids/:id', authenticate, updateKid);
app.get('/api/admin/kids', authenticate, authorize(['admin']), getAllKids);

app.post('/api/leaves', authenticate, markLeave);
app.get('/api/leaves', authenticate, getLeaves);

// Production Static File Serving
if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    // Handle React routing, return all requests to React app (except API calls)
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Lunch Box API is running. Please access the frontend at http://127.0.0.1:5174');
    });
}

app.get('/api/riders', authenticate, authorize(['admin']), (req, res) => {
    db.all('SELECT id, name FROM users WHERE role = "rider"', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Initialize Database
initDb();


// Socket.io Real-time Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_order', (orderId) => {
        socket.join(`order_${orderId}`);
        console.log(`User joined order room: order_${orderId}`);
    });

    socket.on('update_location', (data) => {
        // data: { riderId, orderId, lat, lng, destLat, destLng, distance, eta }
        io.to(`order_${data.orderId}`).emit('location_update', data);
    });

    socket.on('update_status', (data) => {
        // data: { orderId, status }
        io.to(`order_${data.orderId}`).emit('status_update', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const { db } = require('./database'); // Required for simulation query

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
