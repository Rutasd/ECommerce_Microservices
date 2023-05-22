const express = require('express');
const router = express.Router();

const customerController = require('../controller/customer.controller');

router.post('/',customerController.addCustomer);

router.get('/:id',customerController.retrieveCustomerById)
router.get('/status',customerController.getStatus);

router.get('/',customerController.retrieveCustomerByUserId)
module.exports = router;