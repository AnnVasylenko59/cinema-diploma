const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bookingController = {
    // 1. Отримання схеми зали з актуальним статусом зайнятості місць
    getBookingData: async (req, res) => {
        try {
            const { showtimeId } = req.params;
            const sId = parseInt(showtimeId);

            if (isNaN(sId)) return res.status(400).json({ error: "Некоректний ID сеансу" });

            // Отримуємо сеанс, включаючи бронювання та вкладені в них квитки
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

            if (!showtime) return res.status(404).json({ message: "Сеанс не знайдено" });

            // Збираємо всі seatId з усіх квитків у всіх бронюваннях цього сеансу
            const occupiedSeatIds = showtime.bookings.flatMap(booking =>
                booking.tickets.map(ticket => ticket.seatId)
            );

            // Формуємо масив місць, позначаючи зайняті
            const seatsWithStatus = showtime.hall.seats.map(seat => ({
                ...seat,
                isOccupied: occupiedSeatIds.includes(seat.id)
            }));

            res.json({
                ...showtime,
                hall: { ...showtime.hall, seats: seatsWithStatus }
            });
        } catch (error) {
            console.error("Fetch booking data error:", error);
            res.status(500).json({ message: "Помилка сервера при завантаженні зали" });
        }
    },

    // 2. Створення бронювання
    createBooking: async (req, res) => {
        try {
            const { showtimeId, selectedSeats } = req.body;
            const userId = req.user.userId;

            if (!showtimeId || !selectedSeats || selectedSeats.length === 0) {
                return res.status(400).json({ error: "Місця не обрано" });
            }

            const showtime = await prisma.showtime.findUnique({
                where: { id: parseInt(showtimeId) },
                select: { id: true, price: true, hallId: true }
            });

            if (!showtime) return res.status(404).json({ error: "Сеанс не знайдено" });

            const result = await prisma.$transaction(async (tx) => {
                // Перевірка зайнятості через зв'язок Booking -> Ticket
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
                    throw new Error("Деякі з обраних місць уже заброньовані іншим користувачем");
                }

                // Створення запису бронювання
                const booking = await tx.booking.create({
                    data: {
                        userId: userId,
                        showtimeId: showtime.id,
                    }
                });

                // Створення квитків для кожного обраного місця
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
            console.error("Transaction failed:", error.message);
            res.status(500).json({ error: error.message || "Помилка при збереженні бронювання" });
        }
    },

    // 3. Історія бронювань для профілю
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
            console.error("History fetch error:", error);
            res.status(500).json({ error: "Помилка завантаження історії бронювань" });
        }
    }
};

module.exports = bookingController;