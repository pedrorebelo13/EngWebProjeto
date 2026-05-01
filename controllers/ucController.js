const ucModel = require('../models/ucModel')

const normalizeDateField = (dateValue) => {
    if (!dateValue) {
        return { value: null, hasSelection: false };
    }

    if (dateValue instanceof Date) {
        return { value: isNaN(dateValue.getTime()) ? null : dateValue, hasSelection: true };
    }

    if (typeof dateValue === 'string') {
        if (!dateValue.trim()) {
            return { value: null, hasSelection: false };
        }

        const parsed = new Date(dateValue);
        return { value: isNaN(parsed.getTime()) ? null : parsed, hasSelection: true };
    }

    const { dia, mes, ano } = dateValue;
    if (!dia && !mes && !ano) {
        return { value: null, hasSelection: false };
    }

    if (!dia || !mes || !ano) {
        return { value: null, hasSelection: true };
    }

    const parsed = new Date(`${ano}-${mes}-${dia}`);
    return { value: isNaN(parsed.getTime()) ? null : parsed, hasSelection: true };
};

const ucController = {
    createUC: async function(req, res) {
        try {
            // Ponto 2: Atribuir a sigla ao _id automaticamente
            req.body._id = req.body.sigla;

            if (req.body.datas) {
                req.body.datas.teste = normalizeDateField(req.body.datas.teste).value;
                req.body.datas.exame = normalizeDateField(req.body.datas.exame).value;
                req.body.datas.projeto = normalizeDateField(req.body.datas.projeto).value;
            }

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
            
            // Construir objeto de filtro para pesquisa
            let filterObj = {};
            if (req.query.search) {
                const searchRegex = new RegExp(req.query.search, 'i'); // 'i' para case-insensitive
                filterObj = {
                    $or: [
                        { sigla: searchRegex },
                        { titulo: searchRegex }
                    ]
                };
            }
            
            // Construir objeto de ordenação para o Mongoose
            let sortObj = {};
            sortObj[sortField] = sortOrder;

            const ucs = await ucModel.find(filterObj).sort(sortObj);
            
            // Passar os dados e o estado atual para a view
            res.render('ucs', { 
                list: ucs, 
                currentSort: sortField, 
                currentOrder: req.query.order || 'asc',
                search: req.query.search || '',
                success: req.query.success === 'true', // Para sabermos se acabámos de criar algo
                deleted: req.query.deleted === 'true',  // Para sabermos se apagámos algo
                user: req.user // Passar informação do utilizador autenticado
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
                res.render('ucID', { uc: uc, user: req.user });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateUC: async function(req, res) {
        try {
            const existingUC = await ucModel.findById(req.params.id);
            if (!existingUC) {
                return res.status(404).json({ error: "UC não encontrada" });
            }

            if (req.body.datas) {
                const teste = normalizeDateField(req.body.datas.teste);
                const exame = normalizeDateField(req.body.datas.exame);
                const projeto = normalizeDateField(req.body.datas.projeto);

                if (teste.hasSelection) {
                    req.body.datas.teste = teste.value;
                } else {
                    delete req.body.datas.teste;
                }

                if (exame.hasSelection) {
                    req.body.datas.exame = exame.value;
                } else {
                    delete req.body.datas.exame;
                }

                if (projeto.hasSelection) {
                    req.body.datas.projeto = projeto.value;
                } else {
                    delete req.body.datas.projeto;
                }
            }

            // Preservar fotos dos docentes se não houver nova
            if (req.body.docentes && existingUC.docentes) {
                req.body.docentes = req.body.docentes.map((doc, idx) => ({
                    ...doc,
                    foto: doc.foto || existingUC.docentes[idx]?.foto
                }));
            }

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