const express = require('express');
const router = express.Router();
const multer = require('multer');
const ucController = require('../controllers/ucController');
const { requireAuth } = require('../cookies/cookieAuthMiddleware');

/**
 * @openapi
 * /uc/ucs:
 *   get:
 *     tags: [UCs]
 *     summary: List UCs (HTML)
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Middleware para processar uploads de fotos de docentes
const processDocenteFotos = (req, res, next) => {
    if (req.files && req.files.length > 0) {
        // Mapear ficheiros para os docentes
        req.files.forEach((file, index) => {
            // O name do input é docentes[i][foto]
            const fieldName = file.fieldname;
            const match = fieldName.match(/docentes\[(\d+)\]\[foto\]/);
            if (match) {
                const docenteIndex = match[1];
                if (req.body.docentes && req.body.docentes[docenteIndex]) {
                    req.body.docentes[docenteIndex].foto = file.filename;
                }
            }
        });
    }
    next();
};

const getUpload = (req, res, next) => {
    const upload = req.app.locals.upload;
    upload.any()(req, res, next);
};

const jsonUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isJsonMime = file.mimetype === 'application/json' || file.mimetype === 'text/json';
        const isJsonName = file.originalname.toLowerCase().endsWith('.json');
        if (isJsonMime || isJsonName) {
            return cb(null, true);
        }
        return cb(new Error('Apenas ficheiros JSON sao permitidos.'));
    }
});

// Nova UC
router.post('/ucs', requireAuth, getUpload, processDocenteFotos, ucController.createUC); 

/**
 * @openapi
 * /uc/ucs/new:
 *   get:
 *     tags: [UCs]
 *     summary: Render UC creation form
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: HTML form
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       403:
 *         description: Access denied
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
// Formulário para nova UC
router.get('/ucs/new', requireAuth, ucController.newUCForm);

// Listar UCs
router.get('/ucs', requireAuth, ucController.getAllUC);

/**
 * @openapi
 * /uc/ucs/{id}:
 *   get:
 *     tags: [UCs]
 *     summary: Get UC details (HTML)
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *       403:
 *         description: Access denied
 *         content:
 *           text/plain:
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
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *       403:
 *         description: Access denied
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [UCs]
 *     summary: Update UC (form submit)
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *       403:
 *         description: Access denied
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [UCs]
 *     summary: Delete UC
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *       403:
 *         description: Access denied
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
 */
// Consultar uma UC
router.get('/ucs/:id', requireAuth, ucController.getUCById);
// Exportacoes
router.get('/ucs/:id/export/docentes', requireAuth, ucController.exportDocentes);
router.get('/ucs/:id/export/aulas', requireAuth, ucController.exportAulas);
router.get('/ucs/:id/export/full', requireAuth, ucController.exportUcFull);
// Importacoes
router.post('/ucs/:id/import/aulas', requireAuth, jsonUpload.single('file'), ucController.importAulas);
router.post('/ucs/:id/import/full', requireAuth, jsonUpload.single('file'), ucController.importUcFull);
// Alterar uma UC
router.put('/ucs/:id', requireAuth, getUpload, processDocenteFotos, ucController.updateUC);
router.post('/ucs/:id', requireAuth, getUpload, processDocenteFotos, ucController.updateUC);

/**
 * @openapi
 * /uc/ucs/{id}/edit:
 *   get:
 *     tags: [UCs]
 *     summary: Render UC edit form
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
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
 *       403:
 *         description: Access denied
 *         content:
 *           text/plain:
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
router.get('/ucs/:id/edit', requireAuth, ucController.editUCForm);

// Apagar uma UC
router.delete('/ucs/:id', requireAuth, ucController.deleteUC);

module.exports = router;