const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '2026-04-13';

function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.token;
        
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                role: decoded.role
            };
        }
    } catch (error) {
        // Token inválido ou expirado
        res.clearCookie('token');
    }
    
    next();
}

module.exports = authMiddleware;
