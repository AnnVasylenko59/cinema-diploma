const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

/**
 * Отримує локальну IP-адресу сервера в мережі.
 * @returns {string} Локальна IP-адреса або 'localhost'.
 */
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if ((alias.family === 'IPv4' || alias.family === 4) && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

/**
 * Контролер для обробки бізнес-логіки бронювання квитків та генерації PDF.
 * @module controllers/bookingController
 */
const bookingController = {
    /**
     * Отримує локалізовану схему зали та статус зайнятості крісел для конкретного сеансу.
     * @param {Object} req - Об'єкт запиту Express.
     * @param {Object} res - Об'єкт відповіді Express.
     * @returns {Promise<void>}
     */
    getBookingData: async (req, res) => {
        try {
            const { showtimeId } = req.params;
            const sId = parseInt(showtimeId);

            const rawLang = Array.isArray(req.query.lang)
                ? req.query.lang[0]
                : req.query.lang;

            const lang = rawLang === 'en' ? 'en' : 'uk';

            if (isNaN(sId)) return res.status(400).json({ error: 'Некоректний ID сеансу' });

            const showtime = await prisma.showtime.findUnique({
                where: { id: sId },
                include: {
                    movie: { include: { translations: true } },
                    hall: {
                        include: {
                            theater: { include: { translations: true, city: { include: { translations: true } } } },
                            seats: true
                        }
                    },
                    bookings: { include: { tickets: { select: { seatId: true } } } }
                }
            });

            if (!showtime) return res.status(404).json({ message: 'Сеанс не знайдено' });

            const movieTrans = showtime.movie.translations.find(t => t.language === lang) || showtime.movie.translations[0];
            const theaterTrans = showtime.hall.theater.translations.find(t => t.language === lang) || showtime.hall.theater.translations[0];
            const cityTrans = showtime.hall.theater.city?.translations.find(t => t.language === lang) || showtime.hall.theater.city?.translations[0];

            showtime.movie.title = movieTrans ? movieTrans.title : showtime.movie.title;
            showtime.movie.description = movieTrans ? movieTrans.description : showtime.movie.description;
            showtime.hall.theater.name = theaterTrans ? theaterTrans.name : showtime.hall.theater.name;

            showtime.hall.theater.address = theaterTrans ? theaterTrans.address : showtime.hall.theater.address;

            if (showtime.hall.theater.city) {
                showtime.hall.theater.city.name = cityTrans ? cityTrans.name : showtime.hall.theater.city.name;
                delete showtime.hall.theater.city.translations;
            }

            delete showtime.movie.translations;
            delete showtime.hall.theater.translations;

            const occupiedSeatIds = showtime.bookings.flatMap(booking =>
                booking.tickets.map(ticket => ticket.seatId)
            );

            const seatsWithStatus = showtime.hall.seats.map(seat => ({
                ...seat,
                isOccupied: occupiedSeatIds.includes(seat.id)
            }));

            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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
     * Створює нове бронювання та транзакційно резервує обрані місця в базі даних.
     * @param {Object} req - Об'єкт запиту Express.
     * @param {Object} res - Об'єкт відповіді Express.
     * @returns {Promise<void>}
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
                    throw new Error('Деякі з обраних місць вже заброньовані іншим користувачем');
                }

                const booking = await tx.booking.create({
                    data: { userId, showtimeId: showtime.id }
                });

                for (const seatKey of selectedSeats) {
                    const [row, num] = seatKey.split('-').map(Number);
                    const seat = await tx.seat.findFirst({
                        where: { hallId: showtime.hallId, rowNum: row, seatNum: num }
                    });

                    if (seat) {
                        await tx.ticket.create({
                            data: { bookingId: booking.id, seatId: seat.id, price: showtime.price }
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
     * Повертає список усіх бронювань авторизованого користувача з урахуванням 3NF локалізації.
     * @param {Object} req - Об'єкт запиту Express.
     * @param {Object} res - Об'єкт відповіді Express.
     * @returns {Promise<void>}
     */
    getUserBookings: async (req, res) => {
        try {
            const rawLang = Array.isArray(req.query.lang)
                ? req.query.lang[0]
                : req.query.lang;

            const lang = rawLang === 'en' ? 'en' : 'uk';
            const bookings = await prisma.booking.findMany({
                where: { userId: req.user.userId },
                include: {
                    showtime: {
                        include: {
                            movie: { include: { translations: true } },
                            hall: { include: { theater: { include: { translations: true } } } }
                        }
                    },
                    tickets: { include: { seat: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            const localizedBookings = bookings.map(b => {
                const movieTrans = b.showtime.movie.translations.find(t => t.language === lang) || b.showtime.movie.translations[0];
                const theaterTrans = b.showtime.hall.theater.translations.find(t => t.language === lang) || b.showtime.hall.theater.translations[0];

                const cleanBooking = JSON.parse(JSON.stringify(b));
                cleanBooking.showtime.movie.title = movieTrans ? movieTrans.title : cleanBooking.showtime.movie.title;
                cleanBooking.showtime.hall.theater.name = theaterTrans ? theaterTrans.name : cleanBooking.showtime.hall.theater.name;

                delete cleanBooking.showtime.movie.translations;
                delete cleanBooking.showtime.hall.theater.translations;
                return cleanBooking;
            });

            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.json(localizedBookings);
        } catch (error) {
            console.error('History fetch error:', error);
            res.status(500).json({ error: 'Помилка завантаження історії бронювань' });
        }
    },

    /**
     * Генерує електронний PDF-квиток із динамічною локалізацією та вбудованим QR-кодом для верифікації.
     * @param {Object} req - Об'єкт запиту Express.
     * @param {Object} res - Об'єкт відповіді Express.
     * @returns {Promise<void>}
     */
    downloadTicketPdf: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const bId = parseInt(bookingId);
            const rawLang = Array.isArray(req.query.lang)
                ? req.query.lang[0]
                : req.query.lang;

            const lang = rawLang === 'en' ? 'en' : 'uk';

            const booking = await prisma.booking.findUnique({
                where: { id: bId },
                include: {
                    user: true,
                    showtime: {
                        include: {
                            movie: { include: { translations: true } },
                            hall: { include: { theater: { include: { translations: true } } } }
                        }
                    },
                    tickets: { include: { seat: true } }
                }
            });

            if (!booking) return res.status(404).json({ error: 'Бронювання не знайдено' });
            if (booking.userId !== req.user.userId && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Доступ заборонено' });
            }

            const dict = {
                uk: {
                    header: 'КІНОАФІША ПЛЮС',
                    subtitle: 'Електронний квиток на сеанс',
                    cinema: 'Кінотеатр: ',
                    hall: 'Зал: ',
                    time: 'Час: ',
                    row: 'Ряд',
                    seats: 'Місця: ',
                    currency: 'грн',
                    total: 'Всього сплачено: ',
                    qrInfo: 'Контроль на вході за QR-кодом'
                },
                en: {
                    header: 'CINEMA APP PLUS',
                    subtitle: 'Electronic Movie Ticket',
                    cinema: 'Cinema: ',
                    hall: 'Hall: ',
                    time: 'Time: ',
                    row: 'Row',
                    seats: 'Seats: ',
                    currency: 'UAH',
                    total: 'Total paid: ',
                    qrInfo: 'Entrance control via QR code'
                }
            };

            const translation = dict[lang];
            const locale = lang === 'uk' ? 'uk-UA' : 'en-US';

            const movieTrans = booking.showtime.movie.translations.find(t => t.language === lang) || booking.showtime.movie.translations[0];
            const theaterTrans = booking.showtime.hall.theater.translations.find(t => t.language === lang) || booking.showtime.hall.theater.translations[0];
            const localizedMovieTitle = movieTrans ? movieTrans.title : booking.showtime.movie.title;
            const localizedTheaterName = theaterTrans ? theaterTrans.name : booking.showtime.hall.theater.name;

            const localIP = getLocalIpAddress();
            const verificationUrl = `http://${localIP}:5173/validate-ticket/${booking.id}`;
            const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 150 });

            const fontPath = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Regular.ttf');
            const fontBoldPath = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Bold.ttf');
            const useBold = fs.existsSync(fontBoldPath) ? fontBoldPath : fontPath;

            const rowsMap = {};
            booking.tickets.forEach(tick => {
                const rNum = tick.seat.rowNum;
                if (!rowsMap[rNum]) rowsMap[rNum] = [];
                rowsMap[rNum].push(tick.seat.seatNum);
            });

            const totalRowsCount = Object.keys(rowsMap).length;
            const pdfSize = totalRowsCount > 5 ? 'A5' : 'A6';

            const doc = new PDFDocument({ size: pdfSize, margin: 15 });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.id}.pdf`);
            doc.pipe(res);

            doc.font(useBold).fillColor('#1E293B').fontSize(16).text(translation.header, { align: 'center' });
            doc.moveDown(0.15);
            doc.font(fontPath).fillColor('#64748B').fontSize(7.5).text(translation.subtitle, { align: 'center', tracking: 0.5 });
            doc.moveDown(0.4);
            doc.strokeColor('#CBD5E1').lineWidth(0.75).moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
            doc.moveDown(0.5);

            doc.font(useBold).fillColor('#0F172A').fontSize(12.5).text(localizedMovieTitle, { align: 'center' });
            doc.moveDown(0.5);

            doc.font(fontPath).fillColor('#334155').fontSize(9);
            doc.text(`${translation.cinema} ${localizedTheaterName}`, { lineGap: 2 });
            doc.text(`${translation.hall} ${booking.showtime.hall.name}`, { lineGap: 2 });

            const sessionDate = new Date(booking.showtime.startTime).toLocaleDateString(locale, {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            });
            doc.text(`${translation.time} ${sessionDate}`, { lineGap: 2 });

            doc.moveDown(0.4);
            doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(15, doc.y).lineTo(doc.page.width - 15, doc.y).stroke();
            doc.moveDown(0.5);

            Object.keys(rowsMap).sort((a, b) => Number(a) - Number(b)).forEach(rowNum => {
                const sortedSeats = rowsMap[rowNum].sort((a, b) => a - b).join(', ');
                doc.font(useBold).text(`${translation.row} ${rowNum}: `, { continued: true })
                    .font(fontPath).text(sortedSeats, { lineGap: 2 });
            });

            doc.moveDown(0.6);
            const total = booking.tickets.reduce((sum, tick) => sum + tick.price, 0);
            doc.font(useBold).fillColor('#047857').fontSize(11).text(`${translation.total} ${total} ${translation.currency}`, { align: 'center' });
            doc.moveDown(0.4);

            const qrWidth = pdfSize === 'A5' ? 110 : 90;
            const qrX = (doc.page.width - qrWidth) / 2;
            doc.image(qrCodeDataUrl, qrX, doc.y, { width: qrWidth });

            doc.font(fontPath)
                .fillColor('#94A3B8')
                .fontSize(7)
                .text(`ID: ${booking.id} • ${translation.qrInfo}`, 15, doc.page.height - 25, {
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