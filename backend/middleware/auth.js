const jwt = require('jsonwebtoken');

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