const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mapMovieLocale = (movie, lang) => {
    const translation = movie.translations?.find(t => t.language === lang) || movie.translations?.[0];
    const cleanMovie = { ...movie };
    delete cleanMovie.translations;

    return {
        ...cleanMovie,
        title: translation ? translation.title : 'Untitled',
        description: translation ? translation.description : ''
    };
};

/**
 * Отримує аналітику та статистику для панелі адміністратора.
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const getMovieStats = async (req, res) => {
    try {
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';

        const totalRevenueAgg = await prisma.ticket.aggregate({ _sum: { price: true } });
        const revenue = totalRevenueAgg._sum.price || 0;
        const ticketsSold = await prisma.ticket.count();

        const allShowtimes = await prisma.showtime.findMany({
            include: {
                hall: { select: { totalSeats: true } },
                bookings: { include: { _count: { select: { tickets: true } } } }
            }
        });

        let totalCapacity = 0;
        let totalBookedSeats = 0;
        allShowtimes.forEach(st => {
            totalCapacity += st.hall?.totalSeats || 0;
            st.bookings.forEach(b => { totalBookedSeats += b._count.tickets; });
        });

        const occupancyRate = totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0;

        const moviesWithTickets = await prisma.movie.findMany({
            include: { translations: true, showtimes: { include: { bookings: { include: { tickets: true } } } } }
        });

        const topMovies = moviesWithTickets.map(movie => {
            let movieRevenue = 0;
            movie.showtimes.forEach(st => {
                st.bookings.forEach(b => { b.tickets.forEach(t => { movieRevenue += t.price; }); });
            });
            const localized = mapMovieLocale(movie, lang);
            return { id: movie.id, title: localized.title, revenue: movieRevenue };
        })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.json({ revenue, ticketsSold, occupancyRate, topMovies });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Рекомендації фільмів на основі коефіцієнта подібності Жаккара.
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const getRecommendedMovies = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';

        const includeBlock = { translations: true, genres: { include: { genre: true } } };

        if (!userId) {
            const fallbackMovies = await prisma.movie.findMany({ take: 4, orderBy: { addedAt: 'desc' }, include: includeBlock });
            return res.json(fallbackMovies.map(m => mapMovieLocale(m, lang)));
        }

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { favoriteGenres: true } });
        const userGenres = user?.favoriteGenres || [];

        if (userGenres.length === 0) {
            const defaultMovies = await prisma.movie.findMany({ take: 4, orderBy: { addedAt: 'desc' }, include: includeBlock });
            return res.json(defaultMovies.map(m => mapMovieLocale(m, lang)));
        }

        const allMovies = await prisma.movie.findMany({ include: includeBlock });

        const scoredMovies = allMovies.map(movie => {
            const movieGenres = movie.genres.map(g => g.genre.name);
            const intersection = userGenres.filter(g => movieGenres.includes(g));
            const union = Array.from(new Set([...userGenres, ...movieGenres]));
            const indexValue = union.length > 0 ? (intersection.length / union.length) : 0;
            return { ...mapMovieLocale(movie, lang), jaccardIndex: indexValue };
        });

        const recommendations = scoredMovies.filter(movie => movie.jaccardIndex > 0).sort((a, b) => b.jaccardIndex - a.jaccardIndex).slice(0, 4);

        if (recommendations.length < 4) {
            const recIds = recommendations.map(m => m.id);
            const remaining = scoredMovies.filter(movie => !recIds.includes(movie.id)).slice(0, 4 - recommendations.length);
            recommendations.push(...remaining);
        }

        res.json(recommendations.map(({ jaccardIndex, ...movie }) => movie)); //eslint-disable-line no-unused-vars
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Список усіх фільмів з фільтрацією та пагінацією.
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const getAllMovies = async (req, res) => {
    try {
        const { query, genres, minRating, page = 1, limit = 20, lang = 'uk' } = req.query;
        const prismaLang = lang === 'en' ? 'en' : 'uk';
        const where = {};

        if (query) {
            where.OR = [
                { translations: { some: { title: { contains: query, mode: 'insensitive' } } } },
                { director: { contains: query, mode: 'insensitive' } }
            ];
        }

        if (minRating) where.rating = { gte: parseFloat(minRating) };
        if (genres) {
            where.genres = { some: { genre: { name: { in: genres.split(',') } } } };
        }

        const movies = await prisma.movie.findMany({
            where,
            include: { translations: true, genres: { include: { genre: true } } },
            skip: (page - 1) * limit,
            take: parseInt(limit),
        });

        const total = await prisma.movie.count({ where });

        res.json({
            movies: movies.map(m => mapMovieLocale(m, prismaLang)),
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Деталі конкретного фільму за ID.
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const getMovieById = async (req, res) => {
    try {
        const { id } = req.params;
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';

        const movie = await prisma.movie.findUnique({
            where: { id: parseInt(id) },
            include: { translations: true, genres: { include: { genre: true } } }
        });

        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.json(mapMovieLocale(movie, lang));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * СТВОРЕННЯ ФІЛЬМУ (Адмін-функція)
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const createMovie = async (req, res) => {
    try {
        const { title, description, year, durationMin, backdropUrl, posterUrl, trailerUrl, director, genres } = req.body;

        if (!title || !year || !durationMin || !description) {
            return res.status(400).json({ error: 'Обов’язкові поля відсутні.' });
        }

        const genreConnections = genres && Array.isArray(genres)
            ? genres.map(name => ({ genre: { connectOrCreate: { where: { name }, create: { name } } } }))
            : [];

        const newMovie = await prisma.movie.create({
            data: {
                year: parseInt(year),
                durationMin: parseInt(durationMin),
                backdropUrl,
                posterUrl,
                trailerUrl,
                director,
                genres: { create: genreConnections },
                translations: {
                    create: [
                        { language: 'uk', title, description },
                        { language: 'en', title: title + ' (EN)', description: description + ' (English translation needed)' }
                    ]
                }
            },
            include: { translations: true, genres: { include: { genre: true } } }
        });

        res.status(201).json(mapMovieLocale(newMovie, 'uk'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ОНОВЛЕННЯ ФІЛЬМУ (Адмін-функція)
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const updateMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, year, durationMin, backdropUrl, posterUrl, trailerUrl, director, genres, lang = 'uk' } = req.body;
        const movieId = parseInt(id);
        const prismaLang = lang === 'en' ? 'en' : 'uk';

        const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movieExists) return res.status(404).json({ error: 'Фільм не знайдено.' });

        if (genres && Array.isArray(genres)) {
            await prisma.movieGenre.deleteMany({ where: { movieId } });
        }

        const genreConnections = genres && Array.isArray(genres)
            ? genres.map(name => ({ genre: { connectOrCreate: { where: { name }, create: { name } } } }))
            : undefined;

        const translationUpdate = title || description ? {
            upsert: {
                where: { movieId_language: { movieId, language: prismaLang } },
                update: { title, description },
                create: { language: prismaLang, title: title || '', description: description || '' }
            }
        } : undefined;

        const updatedMovie = await prisma.movie.update({
            where: { id: movieId },
            data: {
                year: year ? parseInt(year) : undefined,
                durationMin: durationMin ? parseInt(durationMin) : undefined,
                backdropUrl,
                posterUrl,
                trailerUrl,
                director,
                genres: genreConnections ? { create: genreConnections } : undefined,
                translations: translationUpdate
            },
            include: { translations: true, genres: { include: { genre: true } } }
        });

        res.json(mapMovieLocale(updatedMovie, prismaLang));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ВИДАЛЕННЯ ФІЛЬМУ (Адмін-функція)
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
const deleteMovie = async (req, res) => {
    try {
        const { id } = req.params;
        const movieId = parseInt(id);

        const movieExists = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movieExists) return res.status(404).json({ error: 'Фільм не знайдено.' });

        await prisma.movie.delete({ where: { id: movieId } });
        res.json({ message: 'Фільм успішно видалено.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getRecommendedMovies, getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie, getMovieStats };