const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/showtime/:showtimeId', bookingController.getBookingData);

module.exports = router;