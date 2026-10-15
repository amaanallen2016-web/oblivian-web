const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'Oblivian OS', status: 'running' });
});

io.on('connection', (socket) => {
  socket.on('set-username', (username) => {
    const cleanUser = String(username || 'Guest').trim().slice(0, 20) || 'Guest';
    socket.data.username = cleanUser;
    io.emit('presence', {
      type: 'user-online',
      username: cleanUser,
      count: io.sockets.sockets.size
    });
  });

  socket.on('chat-message', (payload) => {
    const from = String(payload?.from || socket.data.username || 'Guest').trim().slice(0, 20) || 'Guest';
    const message = String(payload?.message || '').trim();
    if (!message) return;

    io.emit('chat-message', {
      from,
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing', (payload) => {
    const from = String(payload?.from || socket.data.username || 'Guest').trim().slice(0, 20) || 'Guest';
    io.emit('typing', { from, typing: Boolean(payload?.typing) });
  });

  socket.on('disconnect', () => {
    io.emit('presence', {
      type: 'user-offline',
      username: socket.data.username || 'Guest',
      count: io.sockets.sockets.size
    });
  });
});

server.listen(PORT, () => {
  console.log(`Oblivian OS server running at http://localhost:${PORT}`);
});
