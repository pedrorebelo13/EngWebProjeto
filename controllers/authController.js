const bcrypt = require('bcryptjs');
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
            const { name, email, password, role } = req.body;
            const wantsJsonResponse = wantsJson(req);

            if (!name || !email || !password) {
                if (wantsJsonResponse) {
                    return res.status(400).json({ error: 'Nome, email e password são obrigatórios.' });
                }
                return res.status(400).render('register', { error: 'Nome, email e password são obrigatórios.' });
            }

            const existingUser = await userModel.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                if (wantsJsonResponse) {
                    return res.status(409).json({ error: 'Já existe um utilizador com esse email.' });
                }
                return res.status(409).render('register', { error: 'Já existe um utilizador com esse email.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new userModel({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'user'
            });

            await newUser.save();

            const token = createToken(newUser);
            res.cookie('token', token, authCookieOptions());

            if (wantsJsonResponse) {
                return res.status(201).json({
                    message: 'Utilizador registado com sucesso.',
                    token,
                    user: {
                        id: newUser._id,
                        name: newUser.name,
                        email: newUser.email,
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
            const { email, password } = req.body;
            const wantsJsonResponse = wantsJson(req);

            if (!email || !password) {
                if (wantsJsonResponse) {
                    return res.status(400).json({ error: 'Email e password são obrigatórios.' });
                }
                return res.status(400).render('login', { error: 'Email e password são obrigatórios.' });
            }

            const user = await userModel.findOne({ email: email.toLowerCase() });
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

            const token = createToken(user);
            res.cookie('token', token, authCookieOptions());

            if (wantsJsonResponse) {
                return res.json({
                    message: 'Login efetuado com sucesso.',
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
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
