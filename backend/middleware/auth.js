import jwt from 'jsonwebtoken';

/**
 * МЕХАНІЗМ БЕЗПЕКИ: Stateless-аутентифікація через JWT.
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @param {Function} next - Функція передачі керування наступному обробнику.
 * @returns {void}
 */
export const auth = (req, res, next) => {
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

/**
 * МЕХАНІЗМ КОНТРОЛЮ ДОСТУПУ (RBAC): Перевірка прав адміністратора.
 * @param {Object} req - Об'єкт запиту Express.
 * @param {Object} res - Об'єкт відповіді Express.
 * @param {Function} next - Функція передачі керування наступному обробнику.
 * @returns {void}
 */
export const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Доступ відхилено. Потрібні права адміністратора.' });
    }
    next();
};