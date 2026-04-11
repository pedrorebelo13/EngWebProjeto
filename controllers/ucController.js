const ucModel = require('../models/ucModel')

const ucController = {
    createUC: async function(req, res) {
        try {
            // Ponto 2: Atribuir a sigla ao _id automaticamente
            req.body._id = req.body.sigla;

            const newUC = new ucModel(req.body);
            await newUC.save();
            
            // Ponto 4: Redirecionar com flag de sucesso no URL
            res.redirect('/uc/ucs?success=true');
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

    editUCForm: async function(req, res) {
        try {
            const uc = await ucModel.findById(req.params.id);
            if (!uc) {
                res.status(404).json({ error: "UC não encontrada" });
            }
            else {
                res.render('newUC', { uc: uc });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }, 

    getAllUC: async function(req, res) {
        try {
            // Obter parâmetros de ordenação da querystring (ou usar padrão "sigla")
            const sortField = req.query.sort || 'sigla';
            const sortOrder = req.query.order === 'desc' ? -1 : 1;
            
            // Construir objeto de ordenação para o Mongoose
            let sortObj = {};
            sortObj[sortField] = sortOrder;

            const ucs = await ucModel.find().sort(sortObj);
            
            // Passar os dados e o estado atual para a view
            res.render('ucs', { 
                list: ucs, 
                currentSort: sortField, 
                currentOrder: req.query.order || 'asc',
                success: req.query.success === 'true', // Para sabermos se acabámos de criar algo
                deleted: req.query.deleted === 'true'  // Para sabermos se apagámos algo
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