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

/**
 * СТВОРЕННЯ ФІЛЬМУ (Адмін-функція)
 * Додає новий фільм до бази даних та пов'язує його з жанрами.
 * @async
 * @param {Object} req - Об'єкт запиту з body фільму.
 * @param {Object} res - Об'єкт відповіді.
 * @returns {Promise<void>}
 */
export const createMovie = async (req, res) => {
    try {
        const {
            title, year, durationMin, backdropUrl,
            posterUrl, trailerUrl, description, rating, director, genres
        } = req.body;

        // Валідація базових полів
        if (!title || !year || !durationMin || !description) {
            return res.status(400).json({ error: 'Обов’язкові поля (title, year, durationMin, description) відсутні.' });
        }

        // Очікуємо, що genres прийде масивом рядків, наприклад: ["Екшн", "Драма"]
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
                genres: {
                    create: genreConnections
                }
            },
            include: {
                genres: { include: { genre: true } }
            }
        });

        res.status(201).json(newMovie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ОНОВЛЕННЯ ФІЛЬМУ (Адмін-функція)
 * Оновлює текстові поля та повністю перезаписує зв'язки з жанрами.
 * @async
 * @param {Object} req - Об'єкт запиту з params.id та body.
 * @param {Object} res - Об'єкт відповіді.
 * @returns {Promise<void>}
 */
export const updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, year, durationMin, backdropUrl,
            posterUrl, trailerUrl, description, rating, director, genres
        } = req.body;

        const movieId = parseInt(id);

        // Перевіряємо чи існує фільм
        const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movieExists) return res.status(404).json({ error: 'Фільм не знайдено.' });

        // Якщо передано новий масив жанрів, спочатку видаляємо старі зв'язки
        if (genres && Array.isArray(genres)) {
            await prisma.movieGenre.deleteMany({
                where: { movieId: movieId }
            });
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
            include: {
                genres: { include: { genre: true } }
            }
        });

        res.json(updatedMovie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ВИДАЛЕННЯ ФІЛЬМУ (Адмін-функція)
 * Видаляє фільм з бази даних.
 * @async
 * @param {Object} req - Об'єкт запиту з params.id.
 * @param {Object} res - Об'єкт відповіді.
 * @returns {Promise<void>}
 */
export const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movieId = parseInt(id);

        const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movieExists) return res.status(404).json({ error: 'Фільм не знайдено.' });

        await prisma.movie.delete({
            where: { id: movieId }
        });

        res.json({ message: 'Фільм успішно видалено з системи.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};