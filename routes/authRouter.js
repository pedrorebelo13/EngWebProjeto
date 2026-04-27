const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @openapi
 * /auth/register:
 *   get:
 *     tags: [Auth]
 *     summary: Render register form
 *     responses:
 *       200:
 *         description: HTML form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags: [Auth]
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: JSON response with token and API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       302:
 *         description: Redirect to /uc/ucs
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/register', authController.registerForm);
router.post('/register', authController.register);

/**
 * @openapi
 * /auth/login:
 *   get:
 *     tags: [Auth]
 *     summary: Render login form
 *     responses:
 *       200:
 *         description: HTML form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags: [Auth]
 *     summary: Login with username or email
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: JSON response with token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       302:
 *         description: Redirect to /uc/ucs
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/login', authController.loginForm);
router.post('/login', authController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: JSON response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       302:
 *         description: Redirect to /auth/login
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authController.logout);

module.exports = router;
