const userModel = require('../models/userModel');

const usersController = {
    listUsers: async function(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).send('Acesso negado. Apenas administradores podem aceder a esta página.');
            }

            const users = await userModel.find().sort({ dataRegisto: -1 });

            res.render('usersList', { users: users, user: req.user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = usersController;
