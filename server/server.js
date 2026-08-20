const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const Location = require('./models/Location');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (optional for local testing)
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleet-tracking')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB not available. Falling back to in-memory storage.'));

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current state to new clients
  Object.values(memoryStore).forEach(loc => socket.emit('locationUpdate', loc));

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const memoryStore = {}; // Fallback storage

// API Routes
app.post('/location', async (req, res) => {
  try {
    const { vehicleId, latitude, longitude } = req.body;

    if (!vehicleId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newLocation = {
      vehicleId,
      latitude,
      longitude,
      timestamp: new Date()
    };
    
    // Try saving to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      const doc = new Location(newLocation);
      await doc.save();
    } else {
      // Fallback
      memoryStore[vehicleId] = newLocation;
    }

    // Broadcast the new location to all connected clients
    io.emit('locationUpdate', newLocation);

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5005;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
