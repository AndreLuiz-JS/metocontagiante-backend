require('dotenv/config');
const jwt = require('jsonwebtoken');
const connection = require('../database/connection');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).send({ error: 'No token on header.' });

    const parts = authHeader.split(' ');
    if (!parts.length === 2) return res.status(401).json({ error: 'Token has a invalid format.' })

    const [ scheme, token ] = parts;

    if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'No Bearer information found.' })

    jwt.verify(token, process.env.SECRET_HASH, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Access denied.' })
        req.userId = decoded.id;

        const user = connection('users')
            .select('email')
            .where('id', req.userId)
            .first();
        if (!user) return res.status(400).json({ error: 'Invalid token provided.' })

        return next();
    })
}