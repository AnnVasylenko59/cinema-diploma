const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.get('/showtime/:showtimeId', bookingController.getBookingData);

router.post('/', auth, bookingController.createBooking);

router.get('/:bookingId/pdf', auth, bookingController.downloadTicketPdf);

module.exports = router;