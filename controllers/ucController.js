const ucModel = require('../models/ucModel')

const ucController = {
    createUC: async function(req, res) {
        try {
            const newUC = new ucModel(req.body);
            await newUC.save();
            res.status(201).json(newUC);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    newUCForm: async function(req, res) {
        try {
            res.render('newUC');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllUC: async function(req, res) {
        try {
            // Obter parâmetros de ordenação da querystring
            const sort = req.query.sort;
            const order = req.query.order === 'desc' ? -1 : 1;
            
            // Construir objeto de ordenação para o Mongoose
            let sortObj = {};
            if (sort) {
                sortObj[sort] = order;
            }

            const ucs = await ucModel.find().sort(sortObj);
            
            // Passar os dados e o estado atual para a view
            res.render('ucs', { 
                list: ucs, 
                currentSort: sort || '', 
                currentOrder: req.query.order || 'asc'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUCById: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else {
                res.render('ucID', { uc: uc });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateUC: async function(req, res) {
        try {
            const updatedUC = await ucModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedUC) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else {
                res.render('ucID', { uc: updatedUC });
            }
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteUC: async function(req, res) {
        try {
            const deletedUC = await ucModel.findByIdAndDelete(req.params.id);
            if (!deletedUC) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else {
                res.json({ message: "UC apagada com sucesso" });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getStats: async function(req, res) {
        try {
            const ucs = await ucModel.find();
            res.json({ count: ucs.length });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ucController;