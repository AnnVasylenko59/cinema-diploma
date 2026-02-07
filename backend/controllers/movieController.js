import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getRecommendedMovies = async (req, res) => {
    try {
        const { id } = req.params;

        // Жанри поточного фільму
        const currentMovie = await prisma.movie.findUnique({
            where: { id: parseInt(id) },
            include: { genres: true }
        });

        if (!currentMovie) return res.status(404).json({ error: 'Movie not found' });

        const genreIds = currentMovie.genres.map(g => g.genreId);

        // 2. Інші фільми з такими ж жанрами
        const movies = await prisma.movie.findMany({
            where: {
                id: { not: parseInt(id) },
                genres: {
                    some: { genreId: { in: genreIds } }
                }
            },
            take: 4,
            include: {
                genres: { include: { genre: true } }
            }
        });

        res.json(movies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllMovies = async (req, res) => {
    try {
        const { query, genres, minRating, page = 1, limit = 20 } = req.query;

        const where = {};

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { director: { contains: query, mode: 'insensitive' } }
            ];
        }

        if (minRating) {
            where.rating = { gte: parseFloat(minRating) };
        }

        if (genres) {
            where.genres = {
                some: {
                    genre: {
                        name: { in: genres.split(',') }
                    }
                }
            };
        }

        const movies = await prisma.movie.findMany({
            where,
            include: {
                genres: {
                    include: {
                        genre: true
                    }
                }
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
        });

        const total = await prisma.movie.count({ where });

        res.json({
            movies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMovieById = async (req, res) => {
    try {
        const { id } = req.params;

        const movie = await prisma.movie.findUnique({
            where: { id: parseInt(id) },
            include: {
                genres: {
                    include: {
                        genre: true
                    }
                }
            }
        });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};