const mongoose = require('mongoose');

const ucSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sigla: { type: String, required: true, unique: true },
    titulo: { type: String, required: true},
    ano: { type: Number, required: true },
    docentes: [{
        nome: { type: String, required: true },
        foto: { type: String },
        categoria: { type: String, required: true },
        filiacao: { type: String, required: true },
        email: { type: String, required: true },
        webpage: { type: String}
    }],
    horario: { 
        teoricas :[{ type: String, required: true }],
        praticas: [{ type: String, required: true }],
    },
    avaliacao: [{ type: String, required: true }],
    datas: {
        teste :{ type: String },
        exame :{ type: String },
        projeto :{ type: String }
    },
    aulas: [{
        tipo: { type: String, required: true },
        data: { type: String, required: true },
        sumario : [{ type: String, required: true }],
    }],
    website: {
        tipo: { type: String, required: true },
        corPrincipal: { type: String, required: true }
    }
});

const UC = mongoose.model('UC', ucSchema, 'ucs');

module.exports = UC;