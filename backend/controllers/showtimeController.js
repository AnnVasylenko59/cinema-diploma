const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Отримує список сеансів на основі заданих фільтрів з урахуванням локалізації 3NF.
 */
const getShowtimes = async (req, res) => {
    try {
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';
        const { movieId, date, cityId } = req.query;
        const where = {};

        if (movieId) where.movieId = parseInt(movieId);
        if (cityId) {
            where.hall = { theater: { cityId: parseInt(cityId) } };
        }

        if (date) {
            const start = new Date(date);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setUTCHours(23, 59, 59, 999);
            where.startTime = { gte: start, lte: end };
        }

        const showtimes = await prisma.showtime.findMany({
            where,
            include: {
                movie: { include: { translations: true } },
                hall: {
                    include: {
                        theater: {
                            include: {
                                translations: true,
                                city: { include: { translations: true } }
                            }
                        },
                        seats: { orderBy: [{ rowNum: 'asc' }, { seatNum: 'asc' }] }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        const localizedShowtimes = showtimes.map(st => {
            const movieTrans = st.movie.translations.find(t => t.language === lang) || st.movie.translations[0];
            const theaterTrans = st.hall.theater.translations.find(t => t.language === lang) || st.hall.theater.translations[0];
            const cityTrans = st.hall.theater.city.translations.find(t => t.language === lang) || st.hall.theater.city.translations[0];

            const cleanShowtime = JSON.parse(JSON.stringify(st));

            cleanShowtime.movie.title = movieTrans ? movieTrans.title : cleanShowtime.movie.title;
            cleanShowtime.movie.description = movieTrans ? movieTrans.description : cleanShowtime.movie.description;
            cleanShowtime.hall.theater.name = theaterTrans ? theaterTrans.name : cleanShowtime.hall.theater.name;
            cleanShowtime.hall.theater.address = theaterTrans ? theaterTrans.address : cleanShowtime.hall.theater.address;

            if (cleanShowtime.hall.theater.city) {
                cleanShowtime.hall.theater.city.name = cityTrans ? cityTrans.name : cleanShowtime.hall.theater.city.name;
                delete cleanShowtime.hall.theater.city.translations;
            }

            delete cleanShowtime.movie.translations;
            delete cleanShowtime.hall.theater.translations;

            return cleanShowtime;
        });

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json(localizedShowtimes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getShowtimes };