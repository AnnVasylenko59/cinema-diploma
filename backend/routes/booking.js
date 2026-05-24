const express = require('express');
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ПУБЛІЧНИЙ ЕНДПОІНТ: Валідація квитка через мобільний пристрій контролера.
 */
router.get('/:bookingId/validate', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);
        const rawLang = Array.isArray(req.query.lang)
            ? req.query.lang[0]
            : req.query.lang;

        const lang = rawLang === 'en' ? 'en' : 'uk';

        const messages = {
            uk: {
                invalidId: 'Некоректний ідентифікатор квитка',
                notFound: 'Квиток не знайдено в базі даних кіносистеми',
                alreadyUsed: 'Квиток НЕВАЛІДНИЙ! За цим кодом вже було здійснено вхід',
                success: 'Вхід дозволено! Квиток успішно активовано',
                rowPrefix: 'Ряд',
                seatPrefix: 'Місце',
                unknownMovie: 'Назва фільму відсутня',
                unknownTheater: 'Кінотеатр',
                unknownCity: 'Місто'
            },
            en: {
                invalidId: 'Invalid ticket identifier',
                notFound: 'Ticket not found in the cinema database',
                alreadyUsed: 'Ticket INVALID! This code has already been used for entry',
                success: 'Access granted! Ticket successfully activated',
                rowPrefix: 'Row',
                seatPrefix: 'Seat',
                unknownMovie: 'Untitled Movie',
                unknownTheater: 'Cinema Theater',
                unknownCity: 'City'
            }
        };

        const msg = messages[lang];

        if (isNaN(bookingId)) {
            return res.status(400).json({ valid: false, message: msg.invalidId });
        }

        // Шукаємо бронювання з новими таблицями перекладів
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                showtime: {
                    include: {
                        movie: {
                            include: { translations: true }
                        },
                        hall: {
                            include: {
                                theater: {
                                    include: {
                                        translations: true,
                                        city: {
                                            include: { translations: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                tickets: { include: { seat: true } }
            }
        });

        if (!booking) {
            return res.status(404).json({ valid: false, message: msg.notFound });
        }

        // Витягуємо потрібну локаль або беремо першу доступну як фолбек
        const movieTranslation = booking.showtime.movie.translations.find(t => t.language === lang)
            || booking.showtime.movie.translations[0];
        const theaterTranslation = booking.showtime.hall.theater.translations.find(t => t.language === lang)
            || booking.showtime.hall.theater.translations[0];
        const cityTranslation = booking.showtime.hall.theater.city.translations.find(t => t.language === lang)
            || booking.showtime.hall.theater.city.translations[0];

        const movieTitle = movieTranslation ? movieTranslation.title : msg.unknownMovie;
        const theaterName = theaterTranslation ? theaterTranslation.name : msg.unknownTheater;
        const cityName = cityTranslation ? cityTranslation.name : msg.unknownCity;

        // Динамічно форматуємо місця відповідно до локалі
        const seatsInfo = booking.tickets.map(t =>
            `${msg.rowPrefix} ${t.seat.rowNum}, ${msg.seatPrefix} ${t.seat.seatNum}`
        ).join('; ');

        // Об'єкт з даними для відповіді (однаковий для обох випадків)
        const responseData = {
            bookingId: booking.id,
            movieTitle: movieTitle,
            startTime: booking.showtime.startTime,
            theaterName: theaterName,
            cityName: cityName,
            hallName: booking.showtime.hall.name,
            seats: seatsInfo,
            ticketsCount: booking.tickets.length
        };

        // 2. Перевірка на повторний прохід
        if (booking.isUsed) {
            return res.json({
                valid: false,
                alreadyUsed: true,
                message: msg.alreadyUsed,
                scannedAt: booking.updatedAt || booking.createdAt,
                ...responseData
            });
        }

        // 3. Якщо успішно — гасимо квиток
        await prisma.booking.update({
            where: { id: bookingId },
            data: { isUsed: true }
        });

        return res.json({
            valid: true,
            message: msg.success,
            ...responseData
        });

    } catch (error) {
        console.error('Validation API Error:', error);
        return res.status(500).json({ valid: false, message: 'Server Error' });
    }
});

module.exports = router;