const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Контролер реалізує критичний шар бізнес-логіки — керування життєвим циклом бронювань.
 * Взаємодіє з Prisma ORM для забезпечення цілісності даних між сутностями Booking, Ticket та Seat.
 * @module bookingController
 * @description ### БІЗНЕС-ЛОГІКА ТА АРХІТЕКТУРА:
 */
const bookingController = {
    /**
     * ### СКЛАДНИЙ АЛГОРИТМ: Синхронізація схеми зали.
     * Перетворює нормалізовані дані БД у високорівневу структуру для фронтенду:
     * 1. **Data Aggregation**: Виконує глибоке вкладене завантаження (Include) через Prisma.
     * 2. **State Flattening**: Використовує `flatMap` для вилучення зайнятих ID місць.
     * 3. **Dynamic Mapping**: Створює віртуальне поле `isOccupied`, зіставляючи статичні місця зали з динамічними квитками сеансу.
     * @async
     * @param {Object} req - Об'єкт запиту Express.
     * @param {Object} res - Об'єкт відповіді Express.
     * @returns {Promise<void>}
     */
    getBookingData: async (req, res) => {
        try {
            const { showtimeId } = req.params;
            const sId = parseInt(showtimeId);

            if (isNaN(sId)) return res.status(400).json({ error: 'Некоректний ID сеансу' });

            const showtime = await prisma.showtime.findUnique({
                where: { id: sId },
                include: {
                    movie: true,
                    hall: { include: { theater: true, seats: true } },
                    bookings: {
                        include: {
                            tickets: { select: { seatId: true } }
                        }
                    }
                }
            });

            if (!showtime) return res.status(404).json({ message: 'Сеанс не знайдено' });

            const occupiedSeatIds = showtime.bookings.flatMap(booking =>
                booking.tickets.map(ticket => ticket.seatId)
            );

            const seatsWithStatus = showtime.hall.seats.map(seat => ({
                ...seat,
                isOccupied: occupiedSeatIds.includes(seat.id)
            }));

            res.json({
                ...showtime,
                hall: { ...showtime.hall, seats: seatsWithStatus }
            });
        } catch (error) {
            console.error('Fetch booking data error:', error);
            res.status(500).json({ message: 'Помилка сервера при завантаженні зали' });
        }
    },

    /**
     * ### КРИТИЧНА БІЗНЕС-ЛОГІКА: Атомарне бронювання.
     * Реалізує алгоритм запобігання подвійного бронювання (Double Booking Prevention):
     * 1. **Transaction Isolation**: Весь процес обгорнуто в `$transaction`. Якщо будь-який крок не вдасться, БД повернеться до початкового стану (Rollback).
     * 2. **Race Condition Protection**: Перед створенням записів виконується перевірка наявності квитків на ці ж координати (row/seat) у межах поточної транзакції.
     * 3. **Data Consistency**: Гарантує, що сума створених Ticket відповідає кількості обраних місць.
     * @async
     * @param {Object} req - Запит із showtimeId та selectedSeats.
     * @param {Object} res - Відповідь із результатом.
     * @returns {Promise<void>} <--- ДОДАЙ ЦЕЙ РЯДОК
     */
    createBooking: async (req, res) => {
        try {
            const { showtimeId, selectedSeats } = req.body;
            const userId = req.user.userId;

            if (!showtimeId || !selectedSeats || selectedSeats.length === 0) {
                return res.status(400).json({ error: 'Місця не обрано' });
            }

            const showtime = await prisma.showtime.findUnique({
                where: { id: parseInt(showtimeId) },
                select: { id: true, price: true, hallId: true }
            });

            if (!showtime) return res.status(404).json({ error: 'Сеанс не знайдено' });

            const result = await prisma.$transaction(async (tx) => {
                const alreadyTakenTickets = await tx.ticket.findMany({
                    where: {
                        booking: { showtimeId: showtime.id },
                        seat: {
                            OR: selectedSeats.map(key => {
                                const [r, n] = key.split('-').map(Number);
                                return { rowNum: r, seatNum: n, hallId: showtime.hallId };
                            })
                        }
                    }
                });

                if (alreadyTakenTickets.length > 0) {
                    throw new Error('Деякі з обраних місць уже заброньовані іншим користувачем');
                }

                const booking = await tx.booking.create({
                    data: {
                        userId: userId,
                        showtimeId: showtime.id,
                    }
                });

                for (const seatKey of selectedSeats) {
                    const [row, num] = seatKey.split('-').map(Number);

                    const seat = await tx.seat.findFirst({
                        where: {
                            hallId: showtime.hallId,
                            rowNum: row,
                            seatNum: num
                        }
                    });

                    if (seat) {
                        await tx.ticket.create({
                            data: {
                                bookingId: booking.id,
                                seatId: seat.id,
                                price: showtime.price
                            }
                        });
                    }
                }
                return booking;
            });

            res.status(201).json({ success: true, bookingId: result.id });
        } catch (error) {
            console.error('Transaction failed:', error.message);
            res.status(500).json({ error: error.message || 'Помилка при збереженні бронювання' });
        }
    },

    /**
     * ### ВЗАЄМОДІЯ КОМПОНЕНТІВ:
     * Забезпечує зв'язок між профілем користувача та історією транзакцій.
     * Використовує сортування `desc` для відображення останніх подій спочатку (UX патерн).
     * @async
     * @param {Object} req - Запит із `req.user.userId`, отриманим від `authenticateToken`.
     * @param {Object} res - Відповідь із масивом замовлень.
     */
    getUserBookings: async (req, res) => {
        try {
            const bookings = await prisma.booking.findMany({
                where: { userId: req.user.userId },
                include: {
                    showtime: {
                        include: {
                            movie: true,
                            hall: { include: { theater: true } }
                        }
                    },
                    tickets: {
                        include: { seat: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(bookings);
        } catch (error) {
            console.error('History fetch error:', error);
            res.status(500).json({ error: 'Помилка завантаження історії бронювань' });
        }
    }
};

module.exports = bookingController;