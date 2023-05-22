const express = require('express');
const router = express.Router();

const bookController = require('../controller/bookstore.controller');

router.get('/:ISBN',bookController.retrieveBook);
router.get('/isbn/:ISBN',bookController.retrieveBook);
router.get('/:ISBN/related-books',bookController.retrieveRelatedBooks);
router.get('/status',bookController.getStatus);
router.post('/',bookController.addBook);

router.put('/:ISBN',bookController.updateBook);

module.exports = router;
