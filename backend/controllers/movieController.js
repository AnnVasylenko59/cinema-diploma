import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Отримує список рекомендованих фільмів на основі жанрів поточного фільму.
 * @async
 * @param {Object} req - Запит з параметром id фільму.
 * @param {Object} res - Відповідь з масивом рекомендованих фільмів.
 * @returns {Promise<void>}
 */
export const getRecommendedMovies = async (req, res) => {
    try {
        const { id } = req.params;

        const currentMovie = await prisma.movie.findUnique({
            where: { id: parseInt(id) },
            include: { genres: true }
        });

        if (!currentMovie) return res.status(404).json({ error: 'Movie not found' });

        const genreIds = currentMovie.genres.map(g => g.genreId);

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

/**
 * Отримує список усіх фільмів з бази даних з фільтрацією та пагінацією.
 * @async
 * @param {Object} req - Об'єкт запиту з query параметрами (genres, minRating, page, limit).
 * @param {Object} res - Відповідь з масивом фільмів та даними пагінації.
 * @returns {Promise<void>}
 */
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

/**
 * Отримує детальну інформацію про конкретний фільм за його ID.
 * @async
 * @param {Object} req - Запит з параметром id.
 * @param {Object} res - Відповідь з даними фільму.
 * @returns {Promise<void>}
 */
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