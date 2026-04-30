const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../cookies/cookieAuthMiddleware');

router.get('/list', requireAuth, usersController.listUsers);
router.get('/:id/edit', requireAuth, usersController.editUserForm);
router.post('/:id', requireAuth, usersController.updateUser);
router.delete('/:id', requireAuth, usersController.deleteUser);

module.exports = router;
