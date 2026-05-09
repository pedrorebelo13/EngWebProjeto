const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || '2026-04-13';

function prefersJson(req) {
    const acceptHeader = req.get('accept') || '';
    return acceptHeader.includes('application/json');
}

async function attachUserFromCookie(req, res, next) {
    try {
        const token = req.cookies && req.cookies.token;

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'docente') {
                const user = await userModel.findById(decoded.sub);
                if (!user || user.docenteAprovado === false) {
                    res.clearCookie('token');
                } else {
                    req.user = {
                        id: decoded.sub,
                        username: decoded.username,
                        email: decoded.email,
                        name: decoded.name,
                        role: decoded.role
                    };
                    res.locals.user = req.user;
                }
            } else {
                req.user = {
                    id: decoded.sub,
                    username: decoded.username,
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role
                };
                res.locals.user = req.user;
            }
        }
    } catch (error) {
        // Invalid or expired token.
        res.clearCookie('token');
    }

    if (!req.user) {
        try {
            const apiKey = req.get('x-api-key');
            if (apiKey) {
                const user = await userModel.findOne({ apiKey });
                if (user && !(user.role === 'docente' && user.docenteAprovado === false)) {
                    req.user = {
                        id: user._id.toString(),
                        username: user.username,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    };
                    res.locals.user = req.user;
                }
            }
        } catch (error) {
            // Ignore API key lookup errors.
        }
    }

    return next();
}

function requireAuth(req, res, next) {
    if (req.user) {
        return next();
    }

    if (prefersJson(req)) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    return res.redirect('/auth/login');
}

module.exports = {
    attachUserFromCookie,
    requireAuth
};
