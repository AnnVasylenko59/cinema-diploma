const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Отримує список усіх міст із локалізованими назвами.
 */
const getCities = async (req, res) => {
    try {
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';

        const cities = await prisma.city.findMany({
            include: {
                translations: true
            }
        });

        // Схлопуємо переклади у пласке поле name
        const localizedCities = cities.map(city => {
            const trans = city.translations.find(t => t.language === lang) || city.translations[0];
            const cleanCity = { ...city };
            cleanCity.name = trans ? trans.name : 'Unknown City';
            delete cleanCity.translations;
            return cleanCity;
        });

        // Захист від кешування на рівні HTTP-заголовків Express
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json(localizedCities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Отримує список кінотеатрів із локалізованими назвами та адресами.
 */
const getTheaters = async (req, res) => {
    try {
        const { cityId } = req.query;
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';

        const where = {};
        if (cityId) {
            where.cityId = parseInt(cityId, 10);
        }

        const theaters = await prisma.theater.findMany({
            where,
            include: {
                translations: true,
                city: {
                    include: {
                        translations: true
                    }
                },
                halls: true
            }
        });

        // Локалізуємо назву кінотеатру, адресу та назву його міста
        const localizedTheaters = theaters.map(theater => {
            const theaterTrans = theater.translations.find(t => t.language === lang) || theater.translations[0];
            const cityTrans = theater.city?.translations.find(t => t.language === lang) || theater.city?.translations[0];

            const cleanTheater = JSON.parse(JSON.stringify(theater));

            cleanTheater.name = theaterTrans ? theaterTrans.name : 'Cinema Theater';
            cleanTheater.address = theaterTrans ? theaterTrans.address : '';

            if (cleanTheater.city) {
                cleanTheater.city.name = cityTrans ? cityTrans.name : 'City';
                delete cleanTheater.city.translations;
            }

            delete cleanTheater.translations;
            return cleanTheater;
        });

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json(localizedTheaters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * СТВОРЕННЯ КІНОТЕАТРУ (Адмін-функція)
 */
const createTheater = async (req, res) => {
    try {
        const { cityId, coords, phone, name, address } = req.body;

        if (!cityId || !coords || !name) {
            return res.status(400).json({ error: 'Обов’язкові поля відсутні.' });
        }

        const newTheater = await prisma.theater.create({
            data: {
                cityId: parseInt(cityId, 10),
                coords,
                phone,
                translations: {
                    create: [
                        { language: 'uk', name, address },
                        { language: 'en', name: name + ' (EN)', address: address ? address + ' (EN)' : '' }
                    ]
                }
            },
            include: { translations: true }
        });

        const trans = newTheater.translations.find(t => t.language === 'uk');
        res.status(201).json({
            id: newTheater.id,
            cityId: newTheater.cityId,
            coords: newTheater.coords,
            phone: newTheater.phone,
            name: trans.name,
            address: trans.address
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCities,
    getTheaters,
    createTheater
};