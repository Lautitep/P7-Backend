const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const bookController = require('../controllers/bookController');

router.get('/', bookController.getAllBooks);
router.get('/bestrating', bookController.getBestRatedBooks);
router.get('/:id', bookController.getOneBook);
router.post('/', auth, multer, bookController.createBook);
router.put('/:id', auth, multer, bookController.updateBook);
router.delete('/:id', auth, bookController.deleteBook);
router.post('/:id/rating', auth, bookController.rateBook);

module.exports = router;
