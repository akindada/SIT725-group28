const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.registerUser);  // <-- here
router.post('/login', authController.loginUser);        // <-- here
router.post('/admin/login', authController.adminLogin);

module.exports = router;
