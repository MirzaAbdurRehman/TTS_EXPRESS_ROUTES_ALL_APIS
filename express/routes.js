
const express = require('express');
const router = express.Router();


const userAuthRoute = require('./Auth_Route');
const productRoute = require('./Product_Route');

router.use('/userAuth', userAuthRoute);
router.use('/products', productRoute);


module.exports = router;
