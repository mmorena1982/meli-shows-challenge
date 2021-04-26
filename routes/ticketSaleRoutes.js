const express = require('express');
const ticketSaleController = require('../controllers/ticketSaleController')

const router = express.Router();

router.get('/shows', ticketSaleController.get_all_shows);
router.get('/performances/:id', ticketSaleController.get_performance_by_id);
router.post('/book', ticketSaleController.book);


module.exports = router;