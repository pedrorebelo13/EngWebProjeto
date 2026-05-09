const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const prefersJson = (req) => {
    const acceptHeader = req.get('accept') || '';
    return acceptHeader.includes('application/json');
};

const ensureAdmin = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).send('Acesso negado. Apenas administradores podem aceder a esta página.');
    }

    return null;
};

const usersController = {
    listUsers: async function(req, res) {
        try {
            const blocked = ensureAdmin(req, res);
            if (blocked) {
                return blocked;
            }

            const users = await userModel.find().sort({ dataRegisto: -1 });

            res.render('usersList', { users: users, user: req.user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    editUserForm: async function(req, res) {
        try {
            const blocked = ensureAdmin(req, res);
            if (blocked) {
                return blocked;
            }

            const targetUser = await userModel.findById(req.params.id);
            if (!targetUser) {
                return res.status(404).send('Utilizador não encontrado.');
            }

            res.render('userEdit', { targetUser, user: req.user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateUser: async function(req, res) {
        try {
            const blocked = ensureAdmin(req, res);
            if (blocked) {
                return blocked;
            }

            const targetUser = await userModel.findById(req.params.id);
            if (!targetUser) {
                return res.status(404).send('Utilizador não encontrado.');
            }

            const { username, name, email, filiacao, role, password } = req.body;
            const normalizedUsername = (username || '').trim().toLowerCase();
            const normalizedEmail = (email || '').trim().toLowerCase();
            const docenteAprovado = req.body.docenteAprovado === 'on' || req.body.docenteAprovado === 'true';

            if (!normalizedUsername || !name || !normalizedEmail) {
                return res.status(400).send('Username, nome e email são obrigatórios.');
            }

            const existingUser = await userModel.findOne({
                _id: { $ne: targetUser._id },
                $or: [
                    { username: normalizedUsername },
                    { email: normalizedEmail }
                ]
            });

            if (existingUser) {
                return res.status(409).send('Já existe um utilizador com esse email ou username.');
            }

            targetUser.username = normalizedUsername;
            targetUser.name = name;
            targetUser.email = normalizedEmail;
            targetUser.filiacao = (filiacao || '').trim();
            targetUser.role = role === 'admin' || role === 'docente' ? role : 'aluno';
            if (targetUser.role === 'docente') {
                targetUser.docenteAprovado = docenteAprovado;
            } else {
                targetUser.docenteAprovado = true;
            }

            if (password) {
                targetUser.password = await bcrypt.hash(password, 10);
            }

            await targetUser.save();

            if (prefersJson(req)) {
                return res.json({ message: 'Utilizador atualizado com sucesso.' });
            }

            return res.redirect('/users/list');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteUser: async function(req, res) {
        try {
            const blocked = ensureAdmin(req, res);
            if (blocked) {
                return blocked;
            }

            if (req.user && req.user.id === req.params.id) {
                return res.status(400).send('Não é possível apagar o próprio utilizador administrador.');
            }

            const targetUser = await userModel.findById(req.params.id);
            if (!targetUser) {
                return res.status(404).send('Utilizador não encontrado.');
            }

            await targetUser.deleteOne();

            if (prefersJson(req)) {
                return res.json({ message: 'Utilizador apagado com sucesso.' });
            }

            return res.redirect('/users/list');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = usersController;
