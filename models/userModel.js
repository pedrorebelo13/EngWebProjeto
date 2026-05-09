const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    filiacao: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'docente', 'aluno'], default: 'aluno' },
    docenteAprovado: { type: Boolean, default: true },
    dataRegisto: { type: Date, default: Date.now },
    dataUltimoAcesso: { type: Date },
    apiKey: { type: String, unique: true, sparse: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
