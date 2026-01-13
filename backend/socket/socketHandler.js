let users = [];

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user joining
        socket.on('join', (userData) => {
            const existingUser = users.find(u => u.id === userData.id);
            if (!existingUser) {
                users.push({ ...userData, socketId: socket.id });
            }
            io.emit('users_update', users);
        });

        // Handle Comments
        socket.on('send_comment', (comment) => {
            io.emit('receive_comment', comment);
        });

        // Handle Reactions
        socket.on('send_reaction', (reaction) => {
            io.emit('receive_reaction', reaction);
        });

        // Handle Seat Updates (Occupancy)
        socket.on('update_seats', (seatData) => {
            socket.broadcast.emit('seats_updated', seatData);
        });

        // WebRTC Signaling for Voice Chat
        socket.on('voice_offer', ({ target, offer }) => {
            io.to(target).emit('voice_offer', { sender: socket.id, offer });
        });

        socket.on('voice_answer', ({ target, answer }) => {
            io.to(target).emit('voice_answer', { sender: socket.id, answer });
        });

        socket.on('voice_candidate', ({ target, candidate }) => {
            io.to(target).emit('voice_candidate', { sender: socket.id, candidate });
        });

        // Handle Disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            users = users.filter(u => u.socketId !== socket.id);
            io.emit('users_update', users);
        });
    });
};
