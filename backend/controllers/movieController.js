const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Отримує список рекомендованих фільмів для поточного користувача на основі коефіцієнта подібності Жаккара.
 * @async
 * @param {Object} req - Запит, що містить дані авторизованого користувача (req.user).
 * @param {Object} res - Відповідь з відсортованим масивом рекомендованих фільмів.
 */
const getRecommendedMovies = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;

        // 1. Якщо користувач не авторизований — віддаємо просто 4 останні фільми
        if (!userId) {
            const fallbackMovies = await prisma.movie.findMany({
                take: 4,
                orderBy: { addedAt: 'desc' },
                include: { genres: { include: { genre: true } } }
            });
            return res.json(fallbackMovies);
        }

        // 2. Завантажуємо улюблені жанри користувача
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { favoriteGenres: true }
        });

        const userGenres = user?.favoriteGenres || [];

        // Якщо користувач ще не обрав жодного улюбленого жанру — повертаємо останні додані
        if (userGenres.length === 0) {
            const defaultMovies = await prisma.movie.findMany({
                take: 4,
                orderBy: { addedAt: 'desc' },
                include: { genres: { include: { genre: true } } }
            });
            return res.json(defaultMovies);
        }

        // 3. Завантажуємо всі фільми з їхніми жанрами
        const allMovies = await prisma.movie.findMany({
            include: {
                genres: { include: { genre: true } }
            }
        });

        // 4. Розраховуємо коефіцієнт Жаккара для кожного фільму
        const scoredMovies = allMovies.map(movie => {
            const movieGenres = movie.genres.map(g => g.genre.name);
            const intersection = userGenres.filter(g => movieGenres.includes(g));
            const union = Array.from(new Set([...userGenres, ...movieGenres]));
            const jaccardIndex = union.length > 0 ? (intersection.length / union.length) : 0;

            return {
                ...movie,
                jaccardIndex
            };
        });

        // 5. Сортуємо за спаданням індексу та беремо перші 4 фільми
        const recommendations = scoredMovies
            .filter(movie => movie.jaccardIndex > 0)
            .sort((a, b) => b.jaccardIndex - a.jaccardIndex)
            .slice(0, 4);

        if (recommendations.length < 4) {
            const recIds = recommendations.map(m => m.id);
            const remaining = scoredMovies
                .filter(movie => !recIds.includes(movie.id))
                .slice(0, 4 - recommendations.length);

            recommendations.push(...remaining);
        }

        const cleanRecommendations = recommendations.map(({ jaccardIndex, ...movie }) => movie);
        res.json(cleanRecommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Отримує список усіх фільмів з бази даних з фільтрацією та пагінацією.
 */
const getAllMovies = async (req, res) => {
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
            include: { genres: { include: { genre: true } } },
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
 */
const getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await prisma.movie.findUnique({
            where: { id: parseInt(id) },
            include: { genres: { include: { genre: true } } }
        });

        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * СТВОРЕННЯ ФІЛЬМУ (Адмін-функція)
 */
const createMovie = async (req, res) => {
    try {
        const { title, year, durationMin, backdropUrl, posterUrl, trailerUrl, description, rating, director, genres } = req.body;

        if (!title || !year || !durationMin || !description) {
            return res.status(400).json({ error: 'Обов’язкові поля відсутні.' });
        }

        const genreConnections = genres && Array.isArray(genres)
            ? genres.map(genreName => ({
                genre: {
                    connectOrCreate: {
                        where: { name: genreName },
                        create: { name: genreName }
                    }
                }
            }))
            : [];

        const newMovie = await prisma.movie.create({
            data: {
                title,
                year: parseInt(year),
                durationMin: parseInt(durationMin),
                backdropUrl,
                posterUrl,
                trailerUrl,
                description,
                rating: rating ? parseFloat(rating) : null,
                director,
                genres: { create: genreConnections }
            },
            include: { genres: { include: { genre: true } } }
        });

        res.status(201).json(newMovie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ОНОВЛЕННЯ ФІЛЬМУ (Адмін-функція)
 */
const updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, year, durationMin, backdropUrl, posterUrl, trailerUrl, description, rating, director, genres } = req.body;
        const movieId = parseInt(id);

        const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movieExists) return res.status(404).json({ error: 'Фільм не знайдено.' });

        if (genres && Array.isArray(genres)) {
            await prisma.movieGenre.deleteMany({ where: { movieId: movieId } });
        }

        const genreConnections = genres && Array.isArray(genres)
            ? genres.map(genreName => ({
                genre: {
                    connectOrCreate: {
                        where: { name: genreName },
                        create: { name: genreName }
                    }
                }
            }))
            : undefined;

        const updatedMovie = await prisma.movie.update({
            where: { id: movieId },
            data: {
                title,
                year: year ? parseInt(year) : undefined,
                durationMin: durationMin ? parseInt(durationMin) : undefined,
                backdropUrl,
                posterUrl,
                trailerUrl,
                description,
                rating: rating ? parseFloat(rating) : undefined,
                director,
                genres: genreConnections ? { create: genreConnections } : undefined
            },
            include: { genres: { include: { genre: true } } }
        });

        res.json(updatedMovie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ВИДАЛЕННЯ ФІЛЬМУ (Адмін-функція)
 */
const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movieId = parseInt(id);

        const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movieExists) return res.status(404).json({ error: 'Фільм не знайдено.' });

        await prisma.movie.delete({ where: { id: movieId } });
        res.json({ message: 'Фільм успішно видалено з системи.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Експорт у форматі CommonJS для app.js
module.exports = {
    getRecommendedMovies,
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie
};