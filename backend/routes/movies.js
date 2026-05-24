const express = require('express');
const router = express.Router();

const movieController = require('../controllers/movieController.js');
const auth = require('../middleware/auth.js');

// Мідлвар для перевірки адміна
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({ error: 'Доступ заборонено. Тільки для адміністраторів.' });
};

// Маршрут для аналітики та статистики (ТІЛЬКИ ДЛЯ АДМІНІВ)
router.get('/stats', auth, isAdmin, movieController.getMovieStats);

// Маршрут для персональних рекомендацій за методом Жаккара
router.get('/recommendations', auth, movieController.getRecommendedMovies);

// Публічні маршрути (каталог та деталка фільму)
router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);

// Адміністративні маршрути керування афішею
router.post('/', auth, isAdmin, movieController.createMovie);
router.put('/:id', auth, isAdmin, movieController.updateMovie);
router.delete('/:id', auth, isAdmin, movieController.deleteMovie);

module.exports = router;