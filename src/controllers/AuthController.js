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
            if (user.change_pwd) {
                const token = jwt.sign({ id: user.id }, process.env.SECRET_HASH, { expiresIn: '10 minutes' });
                await connection('users')
                    .where('id', user.id)
                    .update({ token });
                return res.status(400).json({ error: 'Password expired. Change the password now', temporaryToken: token });
            }
            const token = jwt.sign({ id: user.id }, process.env.SECRET_HASH, { expiresIn: '5 days' });
            return res.json({ email, token })
        }
        catch (err) {
            return res.status(400).json(err)
        }
    },
    async auth(req, res) {
        const { userId } = req;
        const user = await connection('users')
            .join('users_access', 'users.access_level', '=', 'users_access.level')
            .where('users.id', userId)
            .select('name', 'email', 'access_level', 'user_type')
            .first();
        if (!user) return res.status(403).json({ error: 'Invalid credentials.' })
        const response = await connection('users_access')
            .select('*')
            .where('level', '>', -1)
            .andWhere('level', '<', user.access_level)
            .orWhere('level', user.access_level)
            .orderBy('level', 'desc');
        const user_type = response.map(element => element.user_type);
        const hasManagePrivilegies = user_type.includes('post_user');
        if (hasManagePrivilegies) console.log(`${user.name}:${user.email} authenticated as ${user.user_type}`);

        const user_info = { name: user.name, email: user.email, user_type: user.user_type };
        if (user.access_level >= 0) return res.json({ auth: true, user_info, user_types: user_type });

        return res.status(403).json({ error: 'User banned.' })
    }
}