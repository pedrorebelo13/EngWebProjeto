const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../cookies/cookieAuthMiddleware');

router.get('/list', requireAuth, usersController.listUsers);

module.exports = router;
