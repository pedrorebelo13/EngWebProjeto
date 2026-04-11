const express = require('express');
const router = express.Router();
const ucController = require('../controllers/ucController');

// Nova UC
router.post('/ucs', ucController.createUC); 

// Formulário para nova UC
router.get('/ucs/new', ucController.newUCForm);

// Formulário de Edição (novo)
router.get('/ucs/:id/edit', ucController.editUCForm);

// Listar UCs
router.get('/ucs', ucController.getAllUC);

// Consultar uma UC
router.get('/ucs/:id', ucController.getUCById);

// Alterar uma UC - forms and PUT requests
router.put('/ucs/:id', ucController.updateUC);
router.post('/ucs/:id', ucController.updateUC);

// Apagar uma UC
router.delete('/ucs/:id', ucController.deleteUC);

module.exports = router;
