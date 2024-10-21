const express = require('express');
const router = express.Router();
const pool = require('./db'); // PostgreSQL connection

// Route 1: GET /author/:type
router.get('/author/:type', (req, res) => {
    const { type } = req.params;
    if (type === 'name') {
        res.json({ name: "Francis Cordor" }); // Replace with your name
    } else if (type === 'pennkey') {
        res.json({ pennkey: "fcordor" }); // Replace with your PennKey
    } else {
        res.status(404).json({});
    }
});

// Route 2: GET /random
// Modified to join Songs and Albums tables and return song title, album title, and plays
router.get('/random', async (req, res) => {
    const explicit = req.query.explicit;
    let query = `
        SELECT s.song_id, s.title AS song_title, a.title AS album_title, s.plays
        FROM Songs s
        JOIN Albums a ON s.album_id = a.album_id
        ORDER BY RANDOM()
        LIMIT 1
    `;

    if (explicit === 'true') {
        query = `
            SELECT s.song_id, s.title AS song_title, a.title AS album_title, s.plays
            FROM Songs s
            JOIN Albums a ON s.album_id = a.album_id
            WHERE s.explicit = 1
            ORDER BY RANDOM()
            LIMIT 1
        `;
    } else if (explicit === 'false') {
        query = `
            SELECT s.song_id, s.title AS song_title, a.title AS album_title, s.plays
            FROM Songs s
            JOIN Albums a ON s.album_id = a.album_id
            WHERE s.explicit = 0
            ORDER BY RANDOM()
            LIMIT 1
        `;
    }
    try {
        const result = await pool.query(query);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'No song found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 3: GET /song/:song_id
router.get('/song/:song_id', async (req, res) => {
    const { song_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Songs WHERE song_id = $1', [song_id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Song not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 4: GET /album/:album_id
router.get('/album/:album_id', async (req, res) => {
    const { album_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Albums WHERE album_id = $1', [album_id]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Album not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 5: GET /albums
router.get('/albums', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Albums ORDER BY release_date DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 6: GET /album_songs/:album_id
router.get('/album_songs/:album_id', async (req, res) => {
    const { album_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Songs WHERE album_id = $1 ORDER BY number ASC', [album_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 7: GET /top_songs
// Modified to join Songs and Albums and return top songs with album title
router.get('/top_songs', async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
    const offset = (page - 1) * pageSize;
    
    const query = `
        SELECT s.song_id, s.title AS song_title, a.title AS album_title, s.plays
        FROM Songs s
        JOIN Albums a ON s.album_id = a.album_id
        ORDER BY s.plays DESC
        LIMIT $1 OFFSET $2
    `;

    try {
        const result = await pool.query(query, [pageSize, offset]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 8: GET /top_albums
router.get('/top_albums', async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
    const offset = (page - 1) * pageSize;
    
    const query = `
        SELECT a.album_id, a.title, SUM(s.plays) AS total_plays
        FROM Albums a
        JOIN Songs s ON a.album_id = s.album_id
        GROUP BY a.album_id
        ORDER BY total_plays DESC
        LIMIT $1 OFFSET $2
    `;

    try {
        const result = await pool.query(query, [pageSize, offset]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route 9: GET /search_songs
// Modified to align with frontend filters
router.get('/search_songs', async (req, res) => {
    const {
        title,
        duration_low = 60,
        duration_high = 660,
        plays_low = 0,
        plays_high = 1100000000,
        danceability_low = 0,
        danceability_high = 1,
        energy_low = 0,
        energy_high = 1,
        valence_low = 0,
        valence_high = 1,
        explicit = 'false'
    } = req.query;

    let query = `
        SELECT * FROM Songs 
        WHERE duration BETWEEN $1 AND $2
        AND plays BETWEEN $3 AND $4
        AND danceability BETWEEN $5 AND $6
        AND energy BETWEEN $7 AND $8
        AND valence BETWEEN $9 AND $10
        AND ($11::boolean OR explicit = 0)
    `;

    const values = [
        duration_low, duration_high,
        plays_low, plays_high,
        danceability_low, danceability_high,
        energy_low, energy_high,
        valence_low, valence_high,
        explicit === 'true'
    ];

    if (title) {
        query += ` AND title ILIKE '%' || $12 || '%' `;
        values.push(title);
    }

    query += ` ORDER BY title ASC `;

    try {
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;