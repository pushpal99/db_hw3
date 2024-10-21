const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env
const pool = require('./db'); // Import the PostgreSQL pool connection
const routes = require('./routes'); // Import your routes

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use('/', routes); // Use routes from routes.js

// Server port from environment or default to 8080
const PORT = process.env.SERVER_PORT || 8080;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});