require('dotenv/config');
const connection = require('../database/connection');
const bcrypt = require('../utils/bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await connection('users')
                .select('*')
                .where('email', email)
                .first();
            if (!await bcrypt.compare(password, user.password)) return res.status(404).json({ error: 'Invalid password.' })
            const token = jwt.sign({ id: user.id }, process.env.SECRET_HASH, { expiresIn: '5 days' });
            return res.json({ email, token })
        }
        catch (err) {
            return res.status(400).json(err)
        }
    }
}