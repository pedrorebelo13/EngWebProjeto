const express = require('express');
const router = express.Router();
const ucController = require('../controllers/ucController');

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

// Nova UC
router.post('/ucs', getUpload, processDocenteFotos, ucController.createUC); 

// Formulário para nova UC
router.get('/ucs/new', ucController.newUCForm);

// Listar UCs
router.get('/ucs', ucController.getAllUC);

// Consultar uma UC
router.get('/ucs/:id', ucController.getUCById);

// Alterar uma UC
router.put('/ucs/:id', getUpload, processDocenteFotos, ucController.updateUC);
router.post('/ucs/:id', getUpload, processDocenteFotos, ucController.updateUC);

// Formulário para editar uma UC
router.get('/ucs/:id/edit', ucController.editUCForm);

// Apagar uma UC
router.delete('/ucs/:id', ucController.deleteUC);

module.exports = router;