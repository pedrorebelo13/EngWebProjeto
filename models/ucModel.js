const mongoose = require('mongoose');

const ucSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sigla: { type: String, required: true, unique: true },
    titulo: { type: String, required: true},
    ano: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: true },
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
    horarioNorm: {
        teoricas: [{
            raw: { type: String },
            turno: { type: String },
            dia: { type: String },
            inicio: { type: String },
            fim: { type: String },
            sala: { type: String }
        }],
        praticas: [{
            raw: { type: String },
            turno: { type: String },
            dia: { type: String },
            inicio: { type: String },
            fim: { type: String },
            sala: { type: String }
        }]
    },
    avaliacao: [{ type: String, required: true }],
    datas: {
        teste :{ type: Date },
        exame :{ type: Date },
        projeto :{ type: Date }
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