const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/genres
router.get('/', async (req, res) => {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(genres);
    } catch (error) {
        console.error('Помилка отримання жанрів:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;