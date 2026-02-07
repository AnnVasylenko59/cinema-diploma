const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getShowtimes = async (req, res) => {
    try {
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
                movie: true,
                hall: {
                    include: {
                        theater: true,
                        seats: {
                            orderBy: [
                                { rowNum: 'asc' },
                                { seatNum: 'asc' }
                            ]
                        }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getShowtimes };