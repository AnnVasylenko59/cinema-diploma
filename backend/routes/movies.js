import express from 'express';
import {
    getAllMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie
} from '../controllers/movieController.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Публічні маршрути (доступні всім користувачам)
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Адміністративні маршрути (доступні ТІЛЬКИ після auth та з правами isAdmin)
router.post('/', auth, isAdmin, createMovie);
router.put('/:id', auth, isAdmin, updateMovie);
router.delete('/:id', auth, isAdmin, deleteMovie);

export default router;