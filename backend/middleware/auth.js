const jwt = require('jsonwebtoken');

/**
 * МЕХАНІЗМ БЕЗПЕКИ: Stateless-аутентифікація через JWT.
 * * ### АРХІТЕКТУРНЕ РІШЕННЯ:
 * Даний мідлвар реалізує шар безпеки (Security Layer) за патерном "Bearer Token".
 * Він перехоплює запит до потрапляння в контролери, гарантуючи, що доступ мають лише
 * авторизовані користувачі. Це забезпечує масштабованість системи, оскільки сервер
 * не зберігає стан сесій.
 * * ### БІЗНЕС-ЛОГІКА:
 * 1. Перевірка наявності та формату заголовка Authorization.
 * 2. Декодування та верифікація цифрового підпису токена.
 * 3. Ініціалізація об'єкта користувача (id, login, isAdmin) у запиті для подальшого використання.
 * * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @param {Function} next - Функція передачі керування наступному обробнику.
 * @returns {void}
 * @see backend/tests/auth.test.js - Сценарії тестування валідності токенів.
 */
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Доступ заборонено. Токен відсутній або неправильний.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
        const decoded = jwt.verify(token, secret);

        req.user = decoded;

        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ error: 'Недійсний токен або термін дії закінчився' });
    }
};

module.exports = auth;