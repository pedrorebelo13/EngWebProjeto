const express = require('express');
const router = express.Router();
const ucController = require('../controllers/ucController');

/**
 * @openapi
 * /uc/ucs:
 *   get:
 *     tags: [UCs]
 *     summary: List UCs (HTML)
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [sigla, ano]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: HTML list page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags: [UCs]
 *     summary: Create UC
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UcInput'
 *     responses:
 *       302:
 *         description: Redirect to /uc/ucs?success=true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Nova UC
router.post('/ucs', getUpload, processDocenteFotos, ucController.createUC); 

/**
 * @openapi
 * /uc/ucs/new:
 *   get:
 *     tags: [UCs]
 *     summary: Render UC creation form
 *     responses:
 *       200:
 *         description: HTML form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
// Formulário para nova UC
router.get('/ucs/new', ucController.newUCForm);

// Listar UCs
router.get('/ucs', ucController.getAllUC);

/**
 * @openapi
 * /uc/ucs/{id}:
 *   get:
 *     tags: [UCs]
 *     summary: Get UC details (HTML)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML detail page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags: [UCs]
 *     summary: Update UC
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UcInput'
 *     responses:
 *       200:
 *         description: HTML detail page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [UCs]
 *     summary: Update UC (form submit)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UcInput'
 *     responses:
 *       200:
 *         description: HTML detail page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [UCs]
 *     summary: Delete UC
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: JSON response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Consultar uma UC
router.get('/ucs/:id', ucController.getUCById);

// Alterar uma UC
router.put('/ucs/:id', getUpload, processDocenteFotos, ucController.updateUC);
router.post('/ucs/:id', getUpload, processDocenteFotos, ucController.updateUC);

/**
 * @openapi
 * /uc/ucs/{id}/edit:
 *   get:
 *     tags: [UCs]
 *     summary: Render UC edit form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Formulário para editar uma UC
router.get('/ucs/:id/edit', ucController.editUCForm);

// Apagar uma UC
router.delete('/ucs/:id', ucController.deleteUC);

module.exports = router;