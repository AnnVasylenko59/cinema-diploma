const express = require('express');
const {
    register,
    loginUser,
    getProfile,
    updateProfile,
    checkAvailability
} = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Публічні маршрути (доступні без токена)
router.post('/register', register);
router.post('/login', loginUser);

// 2. Додаємо маршрут для перевірки доступності
router.get('/check', checkAvailability);

// Захищені маршрути (потрібен middleware auth)
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;