/**
 * @file app.js
 * Головний вхідний файл API-сервера.
 * * ### АРХІТЕКТУРНІ РІШЕННЯ:
 * - **Pattern**: Використано Middleware-орієнтовану архітектуру Express.js.
 * - **Layering**: Чіткий поділ на шари: Middleware (безпека/логування) -> Routes -> Controllers (бізнес-логіка) -> Prisma (Data Access).
 * - **Statelessness**: Сервер не зберігає стан сесій, використовуючи JWT для ідентифікації кожного запиту.
 * * ### ВЗАЄМОДІЯ:
 * - Виступає центральним вузлом, що об'єднує React-фронтенд та PostgreSQL.
 * - Реалізує CORS для безпечної транскордонної взаємодії компонентів.
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bookingController = require('./controllers/bookingController');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// --- 1. НАЛАШТУВАННЯ MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * ВЗАЄМОДІЯ: Система логування.
 * Забезпечує миттєву діагностику взаємодії між фронтендом та API.
 */
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// --- 2. СЛУЖБОВІ ФУНКЦІЇ ТА АУТЕНТИФІКАЦІЯ ---

/**
 * БІЗНЕС-ЛОГІКА: Перевірка цілісності інфраструктури (Health Check).
 * Гарантує, що API не почне обробку запитів, якщо зв'язок із PostgreSQL через Prisma не встановлено.
 * @async
 * @function checkDatabaseConnection
 * @returns {Promise<boolean>}
 */
async function checkDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connection established');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

/**
 * МЕХАНІЗМ БЕЗПЕКИ: Валідація доступу (Guard Middleware).
 * Реалізує Stateless-аутентифікацію.
 * 1. Витягує Bearer-токен.
 * 2. Перевіряє підпис через `JWT_SECRET`.
 * 3. Ініціалізує `req.user` для наступних контролерів.
 * @function authenticateToken
 * @param {Object} req - Запит.
 * @param {Object} res - Відповідь.
 * @param {Function} next - Наступний мідлвар.
 * @returns {void} <--- ДОДАЙ ЦЕЙ РЯДОК
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Токен відсутній' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-for-development', (err, user) => {
        if (err) {
            // Виводимо причину 403 помилки в консоль сервера
            console.error('❌ JWT Verification Error:', err.message);
            return res.status(403).json({ error: 'Недійсний або прострочений токен' });
        }
        req.user = user;
        next();
    });
};

// --- 3. РОУТИ КОРИСТУВАЧІВ (AUTH & PROFILE) ---

app.get('/api/users/check', async (req, res) => {
    try {
        const { login, email } = req.query;
        let existingUser = null;

        if (login) {
            existingUser = await prisma.user.findFirst({ where: { login: login } });
        } else if (email) {
            existingUser = await prisma.user.findFirst({ where: { email: email } });
        }

        // Якщо користувача не знайдено, значить логін/email вільні (available: true)
        res.json({ available: !existingUser });
    } catch (error) {
        console.error('❌ Check error:', error);
        res.status(500).json({ error: 'Помилка при перевірці доступності' });
    }
});

/**
 * БІЗНЕС-ЛОГІКА: Аутентифікація та видача доступу.
 * Використовує складний запит OR-пошуку (Login або Email) для зручності користувача.
 * Генерує токен з терміном дії 24h.
 */
app.post('/api/users/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) return res.status(400).json({ success: false, error: 'Логін та пароль обовʼязкові' });

        const user = await prisma.user.findFirst({
            where: { OR: [{ login: login }, { email: login }] }
        });

        if (!user || password !== user.password) {
            return res.status(401).json({ success: false, error: 'Неправильний логін або пароль' });
        }

        const token = jwt.sign(
            { userId: user.id, login: user.login, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'fallback-secret-key-for-development',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            user: {
                id: user.id, login: user.login, name: user.name, email: user.email,
                avatar: user.avatar, favoriteGenres: user.favoriteGenres,
                language: user.language, theme: user.theme, isAdmin: user.isAdmin
            },
            token
        });
    } catch {
        res.status(500).json({ success: false, error: 'Помилка сервера' });
    }
});

app.post('/api/users/register', async (req, res) => {
    try {
        const { login, name, email, password } = req.body;
        const existingUser = await prisma.user.findFirst({ where: { OR: [{ login }, { email }] } });
        if (existingUser) return res.status(409).json({ success: false, error: 'Користувач вже існує' });

        const newUser = await prisma.user.create({
            data: { login, name, email, password, isAdmin: false }
        });

        const token = jwt.sign(
            { userId: newUser.id, login: newUser.login },
            process.env.JWT_SECRET || 'fallback-secret-key-for-development',
            { expiresIn: '24h' }
        );
        res.status(201).json({ success: true, user: newUser, token });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true, login: true, name: true, email: true,
                avatar: true, favoriteGenres: true, language: true, theme: true,
                isAdmin: true, createdAt: true
            }
        });
        if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { name, avatar, favoriteGenres, language, theme } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { name, avatar, favoriteGenres, language, theme },
            select: {
                id: true, login: true, name: true, email: true,
                avatar: true, favoriteGenres: true, language: true, theme: true,
                isAdmin: true, createdAt: true
            }
        });
        res.json({ success: true, user: updatedUser });
    } catch {
        res.status(500).json({ error: 'Помилка при оновленні профілю' });
    }
});


// --- 4. СПИСОК БАЖАНОГО (WATCHLIST) ---

app.get('/api/watchlist', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.watchlistItem.findMany({
            where: { userId: req.user.userId },
            include: {
                movie: {
                    include: { genres: { include: { genre: true } } }
                }
            }
        });
        res.json(items.map(item => item.movie));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/watchlist/toggle', authenticateToken, async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.user.userId;

        const existing = await prisma.watchlistItem.findUnique({
            where: {
                userId_movieId: { userId: userId, movieId: parseInt(movieId) }
            }
        });

        if (existing) {
            await prisma.watchlistItem.delete({ where: { id: existing.id } });
            return res.json({ success: true, added: false });
        } else {
            await prisma.watchlistItem.create({
                data: { userId: userId, movieId: parseInt(movieId) }
            });
            return res.json({ success: true, added: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 5. РОБОТА З ФІЛЬМАМИ ТА ЖАНРАМИ ---

app.get('/api/movies', async (req, res) => {
    try {
        const movies = await prisma.movie.findMany({
            include: { genres: { include: { genre: true } } }
        });
        res.json({ movies });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/genres', async (req, res) => {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(genres);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/movies/:id/recommended', async (req, res) => {
    try {
        const { id } = req.params;
        const currentMovie = await prisma.movie.findUnique({
            where: { id: parseInt(id) },
            include: { genres: true }
        });

        if (!currentMovie) return res.status(404).json({ error: 'Movie not found' });
        const genreIds = currentMovie.genres.map(g => g.genreId);

        const recommended = await prisma.movie.findMany({
            where: {
                id: { not: parseInt(id) },
                genres: { some: { genreId: { in: genreIds } } }
            },
            take: 4,
            include: { genres: { include: { genre: true } } }
        });
        res.json(recommended);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 6. МІСТА ТА КІНОТЕАТРИ (Роути для TheatersPage) ---

app.get('/api/theaters/cities', async (req, res) => {
    try {
        const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
        res.json(cities);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/theaters', async (req, res) => {
    try {
        const { cityId } = req.query;
        const where = cityId ? { cityId: parseInt(cityId) } : {};
        const theaters = await prisma.theater.findMany({
            where,
            include: { halls: true }
        });
        res.json({ theaters });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 7. СЕАНСИ ТА БРОНЮВАННЯ ---

/**
 * ### ВАЖКИЙ АЛГОРИТМ: Динамічна фільтрація за часовим діапазоном.
 * Обробляє пошук сеансів за датою, конвертуючи вхідний рядок YYYY-MM-DD у математичний діапазон:
 * 1. `startOfDay`: Встановлює час на 00:00:00.000.
 * 2. `endOfDay`: Встановлює час на 23:59:59.999.
 * 3. Виконує запит Prisma з операторами `gte` (>=) та `lte` (<=), що забезпечує
 * коректне вилучення сеансів незалежно від часового поясу сервера.
 * * @async
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @returns {Promise<void>}
 */
app.get('/api/showtimes', async (req, res) => {
    try {
        const { movieId, date, cityId } = req.query;
        const where = {};
        if (movieId) where.movieId = parseInt(movieId);
        if (cityId) where.hall = { theater: { cityId: parseInt(cityId) } };

        if (date) {
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
            where.startTime = { gte: startOfDay, lte: endOfDay };
        }

        const showtimes = await prisma.showtime.findMany({
            where,
            include: { movie: true, hall: { include: { theater: true } } },
            orderBy: { startTime: 'asc' }
        });
        res.json(showtimes);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Роути бронювання мають бути перед 404 handler
app.get('/api/bookings/showtime/:showtimeId', bookingController.getBookingData);
app.post('/api/bookings', authenticateToken, bookingController.createBooking);
app.get('/api/users/my-bookings', authenticateToken, bookingController.getUserBookings);

// --- 8. СЛУЖБОВІ РОУТИ ТА ОБРОБКА ПОМИЛОК ---

app.get('/api/health', async (req, res) => {
    const dbStatus = await checkDatabaseConnection();
    res.json({ status: 'OK', database: dbStatus ? 'connected' : 'disconnected' });
});

// Фінальний обробник 404
app.use((req, res) => {
    console.log(`⚠️ 404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Маршрут не знайдено на сервері' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    checkDatabaseConnection();
});

module.exports = { app, prisma };