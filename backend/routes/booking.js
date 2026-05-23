const express = require('express');
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ПУБЛІЧНИЙ ЕНДПОІНТ: Валідація квитка через мобільний пристрій контролера.
 * Доступний без авторизації, щоб сканер на телефоні міг миттєво зчитати статус.
 */
router.get('/:bookingId/validate', async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);

        if (isNaN(bookingId)) {
            return res.status(400).json({ valid: false, message: 'Некоректний ідентифікатор квитка' });
        }

        // Шукаємо бронювання з усіма необхідними зв'язками (включаючи місто!)
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                showtime: {
                    include: {
                        movie: true,
                        hall: {
                            include: {
                                theater: {
                                    include: { city: true }
                                }
                            }
                        }
                    }
                },
                tickets: { include: { seat: true } }
            }
        });

        // 1. Перевірка на існування
        if (!booking) {
            return res.status(404).json({ valid: false, message: 'Квиток не знайдено в базі даних кіносистеми' });
        }

        // Формуємо компактну структуру для згрупованих місць (потрібно для обох статусів)
        const seatsInfo = booking.tickets.map(t => `Ряд ${t.seat.rowNum}, Місце ${t.seat.seatNum}`).join('; ');

        // 2. Перевірка на повторний прохід
        if (booking.isUsed) {
            return res.json({
                valid: false,
                alreadyUsed: true,
                message: 'Квиток НЕВАЛІДНИЙ! За цим кодом вже було здійснено вхід',
                scannedAt: booking.updatedAt || booking.createdAt,
                bookingId: booking.id,
                movieTitle: booking.showtime.movie.title,
                startTime: booking.showtime.startTime,
                theaterName: booking.showtime.hall.theater.name,
                cityName: booking.showtime.hall.theater.city.name,
                hallName: booking.showtime.hall.name,
                seats: seatsInfo,
                ticketsCount: booking.tickets.length
            });
        }

        // 3. Якщо квиток успішний — гасимо його (і зберігаємо час оновлення updatedAt)
        await prisma.booking.update({
            where: { id: bookingId },
            data: { isUsed: true }
        });

        return res.json({
            valid: true,
            message: 'Вхід дозволено! Квиток успішно активовано',
            bookingId: booking.id,
            movieTitle: booking.showtime.movie.title,
            startTime: booking.showtime.startTime,
            theaterName: booking.showtime.hall.theater.name,
            cityName: booking.showtime.hall.theater.city.name,
            hallName: booking.showtime.hall.name,
            seats: seatsInfo,
            ticketsCount: booking.tickets.length
        });

    } catch (error) {
        console.error('Validation API Error:', error);
        return res.status(500).json({ valid: false, message: 'Внутрішня помилка сервера при валідації' });
    }
});

module.exports = router;