// db.js

require('dotenv').config(); // Load environment variables from .env
const { Pool } = require('pg'); // Import the Pool class from the pg package

// Create a new pool instance with your PostgreSQL credentials from .env
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,  // This can be adjusted based on your SSL certificate settings
    },
});

// Export the pool so it can be used in other parts of the application
module.exports = pool;