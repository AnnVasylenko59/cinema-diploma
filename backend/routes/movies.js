import express from 'express';
import {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie,
    getRecommendedMovies,
    getMovieStats // <-- Імпортуємо нову функцію аналітики
} from '../controllers/movieController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Маршрут для аналітики та статистики для адмін-панелі (ТІЛЬКИ ДЛЯ АДМІНІВ)
router.get('/stats', auth, isAdmin, getMovieStats);

// Маршрут для персональних рекомендацій за методом Жаккара (потрібна авторизація)
router.get('/recommendations', auth, getRecommendedMovies);

// Публічні маршрути (доступні всім користувачам)
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Адміністративні маршрути (доступні ТІЛЬКИ після auth та з правами isAdmin)
router.post('/', auth, isAdmin, createMovie);
router.put('/:id', auth, isAdmin, updateMovie);
router.delete('/:id', auth, isAdmin, deleteMovie);

export default router;