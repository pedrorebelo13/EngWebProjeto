const express = require('express');
const router = express.Router();
const ucController = require('../controllers/ucController');

// Nova UC
router.post('/ucs', ucController.createUC); 

// Formulário para nova UC
router.get('/ucs/new', ucController.newUCForm);

// Listar UCs
router.get('/ucs', ucController.getAllUC);

// Consultar uma UC
router.get('/ucs/:id', ucController.getUCById);

// Alterar uma UC
router.put('/ucs/:id', ucController.updateUC);
router.post('/ucs/:id', ucController.updateUC);

// Formulário para editar uma UC
router.get('/ucs/:id/edit', ucController.editUCForm);

// Apagar uma UC
router.delete('/ucs/:id', ucController.deleteUC);

module.exports = router;