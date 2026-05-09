const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || '2026-04-13';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function wantsJson(req) {
    const acceptHeader = req.get('accept') || '';
    return acceptHeader.includes('application/json');
}

function authCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000
    };
}

function createToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'EngWebProjeto'
        }
    );
}

const authController = {
    registerForm: async function(req, res) {
        try {
            res.render('register');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    loginForm: async function(req, res) {
        try {
            res.render('login');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    register: async function(req, res) {
        try {
            const { username, name, email, password, role, filiacao } = req.body;
            const wantsJsonResponse = wantsJson(req);
            const normalizedEmail = (email || '').trim().toLowerCase();
            const normalizedUsername = (username || '').trim().toLowerCase();

            if (!normalizedUsername || !name || !normalizedEmail || !password) {
                if (wantsJsonResponse) {
                    return res.status(400).json({ error: 'Username, nome, email e password são obrigatórios.' });
                }
                return res.status(400).render('register', { error: 'Username, nome, email e password são obrigatórios.' });
            }

            const existingUser = await userModel.findOne({
                $or: [
                    { email: normalizedEmail },
                    { username: normalizedUsername }
                ]
            });
            if (existingUser) {
                if (wantsJsonResponse) {
                    return res.status(409).json({ error: 'Já existe um utilizador com esse email ou username.' });
                }
                return res.status(409).render('register', { error: 'Já existe um utilizador com esse email ou username.' });
            }

            const normalizedRole = role === 'docente' ? 'docente' : 'aluno';
            const apiKey = crypto.randomBytes(24).toString('hex');
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new userModel({
                username: normalizedUsername,
                name,
                email: normalizedEmail,
                filiacao: (filiacao || '').trim(),
                password: hashedPassword,
                role: normalizedRole,
                docenteAprovado: normalizedRole === 'docente' ? false : true,
                apiKey
            });

            await newUser.save();

            if (normalizedRole === 'docente') {
                const message = 'Registo efetuado. Aguardas aprovação do administrador.';
                if (wantsJsonResponse) {
                    return res.status(201).json({
                        message,
                        pendingApproval: true
                    });
                }

                return res.status(200).render('login', { notice: message });
            }

            const token = createToken(newUser);
            res.cookie('token', token, authCookieOptions());

            if (wantsJsonResponse) {
                return res.status(201).json({
                    message: 'Utilizador registado com sucesso.',
                    token,
                    apiKey,
                    user: {
                        id: newUser._id,
                        username: newUser.username,
                        name: newUser.name,
                        email: newUser.email,
                        filiacao: newUser.filiacao,
                        role: newUser.role
                    }
                });
            }

            return res.redirect('/uc/ucs');
        } catch (error) {
            if (wantsJson(req)) {
                return res.status(500).json({ error: error.message });
            }

            return res.status(500).render('register', { error: error.message });
        }
    },

    login: async function(req, res) {
        try {
            const { identifier, password } = req.body;
            const wantsJsonResponse = wantsJson(req);
            const normalizedIdentifier = (identifier || '').trim().toLowerCase();

            if (!normalizedIdentifier || !password) {
                if (wantsJsonResponse) {
                    return res.status(400).json({ error: 'Username ou email e password são obrigatórios.' });
                }
                return res.status(400).render('login', { error: 'Username ou email e password são obrigatórios.' });
            }

            const user = await userModel.findOne({
                $or: [
                    { email: normalizedIdentifier },
                    { username: normalizedIdentifier }
                ]
            });
            if (!user) {
                if (wantsJsonResponse) {
                    return res.status(401).json({ error: 'Credenciais inválidas.' });
                }
                return res.status(401).render('login', { error: 'Credenciais inválidas.' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                if (wantsJsonResponse) {
                    return res.status(401).json({ error: 'Credenciais inválidas.' });
                }
                return res.status(401).render('login', { error: 'Credenciais inválidas.' });
            }

            if (user.role === 'docente' && user.docenteAprovado === false) {
                const message = 'Conta docente pendente de aprovação pelo administrador.';
                if (wantsJsonResponse) {
                    return res.status(403).json({ error: message });
                }
                return res.status(403).render('login', { error: message });
            }

            user.dataUltimoAcesso = new Date();
            await user.save();

            const token = createToken(user);
            res.cookie('token', token, authCookieOptions());

            if (wantsJsonResponse) {
                return res.json({
                    message: 'Login efetuado com sucesso.',
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        name: user.name,
                        email: user.email,
                        filiacao: user.filiacao,
                        role: user.role
                    }
                });
            }

            return res.redirect('/uc/ucs');
        } catch (error) {
            if (wantsJson(req)) {
                return res.status(500).json({ error: error.message });
            }

            return res.status(500).render('login', { error: error.message });
        }
    },

    logout: async function(req, res) {
        try {
            res.clearCookie('token');
            if (wantsJson(req)) {
                return res.json({ message: 'Logout efetuado com sucesso.' });
            }

            return res.redirect('/auth/login');
        } catch (error) {
            if (wantsJson(req)) {
                return res.status(500).json({ error: error.message });
            }

            return res.status(500).render('login', { error: error.message });
        }
    }
};

module.exports = authController;
