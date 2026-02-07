const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCities = async (req, res) => {
    try {
        const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
        res.json(cities);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getAllTheaters = async (req, res) => {
    try {
        const { cityId } = req.query;
        const where = cityId ? { cityId: parseInt(cityId) } : {};
        const theaters = await prisma.theater.findMany({
            where,
            include: { halls: true }
        });
        res.json({ theaters });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getAllTheaters, getCities };