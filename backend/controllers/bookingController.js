const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs'); // Додано модуль для перевірки файлів шрифтів

const prisma = new PrismaClient();

/**
 * Контролер реалізує критичний шар бізнес-логіки — керування життєвим циклом бронювань.
 * Взаємодіє з Prisma ORM для забезпечення цілісності даних між сутностями Booking, Ticket та Seat.
 * @module bookingController
 */
const bookingController = {
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
    },

    /**
     * ### НАУКОВО-ПРИКЛАДНИЙ МОДУЛЬ: Динамічна генерація звітних документів.
     * Формування електронних квитків PDF з виправленим відображенням валюти та покращеним дизайном.
     */
    downloadTicketPdf: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const bId = parseInt(bookingId);

            const booking = await prisma.booking.findUnique({
                where: { id: bId },
                include: {
                    user: true,
                    showtime: {
                        include: {
                            movie: true,
                            hall: { include: { theater: true } }
                        }
                    },
                    tickets: { include: { seat: true } }
                }
            });

            if (!booking) return res.status(404).json({ error: 'Бронювання не знайдено' });

            if (booking.userId !== req.user.userId && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Доступ заборонено' });
            }

            const verificationUrl = `https://cinema-diploma.vercel.app/tickets/verify/${booking.id}`;
            const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 150 });

            const doc = new PDFDocument({ size: 'A6', margin: 15 });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.id}.pdf`);
            doc.pipe(res);

            const fontPath = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Regular.ttf');
            const fontBoldPath = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Bold.ttf');

            const useBold = fs.existsSync(fontBoldPath) ? fontBoldPath : fontPath;

            doc.font(useBold).fillColor('#1E293B').fontSize(16).text('КІНОАФІША ПЛЮС', { align: 'center' });
            doc.moveDown(0.15);

            doc.font(fontPath).fillColor('#64748B').fontSize(7.5).text('Електронний квиток на сеанс', { align: 'center', tracking: 0.5 });
            doc.moveDown(0.4);

            doc.strokeColor('#CBD5E1').lineWidth(0.75).moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
            doc.moveDown(0.5);

            doc.font(useBold).fillColor('#0F172A').fontSize(12.5).text(booking.showtime.movie.title, { align: 'center' });
            doc.moveDown(0.5);

            doc.font(fontPath).fillColor('#334155').fontSize(9);
            doc.text(`Кінотеатр:  ${booking.showtime.hall.theater.name}`, { lineGap: 2 });
            doc.text(`Зал:  ${booking.showtime.hall.name}`, { lineGap: 2 });

            const sessionDate = new Date(booking.showtime.startTime).toLocaleDateString('uk-UA', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            });
            doc.text(`Час:  ${sessionDate}`, { lineGap: 2 });

            doc.moveDown(0.4);
            doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
            doc.moveDown(0.5);

            doc.font(fontPath).fillColor('#334155').fontSize(8.5);
            booking.tickets.forEach((t, i) => {
                doc.text(`Місце ${i + 1}: Ряд ${t.seat.rowNum}, Крісло ${t.seat.seatNum} (${t.price} грн)`, { lineGap: 2 });
            });

            doc.moveDown(0.6);

            const total = booking.tickets.reduce((sum, t) => sum + t.price, 0);
            doc.font(useBold).fillColor('#047857').fontSize(11).text(`Всього сплачено: ${total} грн`, { align: 'center' });
            doc.moveDown(0.5);

            const qrWidth = 90;
            const qrX = (doc.page.width - qrWidth) / 2;
            doc.image(qrCodeDataUrl, qrX, doc.y, { width: qrWidth });

            doc.font(fontPath)
                .fillColor('#94A3B8')
                .fontSize(7)
                .text(`ID: ${booking.id} • Контроль на вході за QR-кодом`, 15, doc.page.height - 25, {
                    align: 'center',
                    width: doc.page.width - 30
                });

            doc.end();
        } catch (error) {
            console.error('PDF generation crash:', error);
            res.status(500).json({ error: 'Помилка при збиранні PDF-файлу' });
        }
    }
};

module.exports = bookingController;