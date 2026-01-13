const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ip = require('ip');
const apiRoutes = require('./routes/api');
const socketHandler = require('./socket/socketHandler');

const app = express();
app.use(cors());

const server = http.createServer(app);
app.use('/api', apiRoutes);

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// Initialize Socket.io Logic
socketHandler(io);

const PORT = 3000;
const IP_ADDRESS = ip.address();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://${IP_ADDRESS}:${PORT}`);
    console.log(`Make sure your React Native app connects to this IP!`);
});
