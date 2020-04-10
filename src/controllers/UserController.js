require('dotenv/config');
const jwt = require('jsonwebtoken');
const connection = require('../database/connection');
const generateUniqueId = require('../utils/generateUniqueId');
const bcrypt = require('../utils/bcrypt');
const master_level = 50;
const admin_level = 10;
const post_level = 5;
const user_level = 0;
const banned_level = -5;

module.exports = {
    async index(req, res) {
        const { userId } = req;
        const { name, email, access_level } = await connection('users').select('*').where('id', userId).first();
        if (Number(access_level) < admin_level) return res.status(403).json({ error: 'Admin access level required.' });
        console.log(`User ${name}: ${email} get a list of all users.`);
        const users = await connection('users').select('name', ' email', ' access_level');
        return res.json(users);
    },
    async create(req, res) {
        const id = generateUniqueId();
        const { name, email, password } = req.body;
        const hash = await bcrypt.encrypt(password);
        const access_level = (
            email === process.env.ADMIN_EMAIL
            && password === process.env.SECRET_HASH
        ) ? master_level : user_level;
        try {
            await connection('users').insert({
                id,
                name,
                email,
                password: hash,
                access_level
            });
            const token = jwt.sign({ id }, process.env.SECRET_HASH, { expiresIn: '5 days' });
            console.log(`${name} is now Master Admin`);
            return res.json({ email, token })
        } catch (err) {
            return res.status(400).json({ error: `${email} already registred.`, code: err.code })
        }
    },
    async update(req, res) {
        const { userId } = req;
        const { name, email, password, newPassword } = req.body;
        const user = await connection('users')
            .where('id', userId)
            .select('*')
            .first();

        if (!await bcrypt.compare(password, user.password)) return res.status(404).json({ error: 'Invalid password.' });

        if (name && name !== user.name)
            try {
                await connection('users')
                    .where({ id: userId })
                    .update({ name });
                return res.json({ info: 'Name changed.' });
            } catch (err) {
                return res.status(400).json({ error: 'Name is null.' });
            }
        if (email && email !== user.email)
            try {
                await connection('users')
                    .where('id', userId)
                    .update({
                        email,
                    });
                return res.json({ info: 'Email changed.' });
            } catch (err) {
                return res.status(400).json({ error: 'Email already registred or null.' });
            }
        if (newPassword && newPassword !== password)
            try {
                const hash = await bcrypt.encrypt(newPassword);
                await connection('users')
                    .where('id', userId)
                    .update({
                        password: hash,
                    });
                return res.json({ info: 'Password changed.' });
            } catch (err) {
                return res.status(400).json({ error: 'Password cannot be changed.' });
            }
        return res.status(304).json({ info: 'Nothing to change' })
    },
    async changeRights(req, res) {
        const { userId } = req;
        const { email, password, emailToChangeAccess, newAccessLevel } = req.body;

        const user = await connection('users')
            .where('id', userId)
            .select('name', 'email', 'password', 'access_level')
            .first();
        if (user.access_level < admin_level) return res.status(403).json({ error: 'Forbidden' });

        if (!await bcrypt.compare(password, user.password)) return res.status(404).json({ error: 'Invalid password.' });

        try {
            const access_level = Math.min(user.access_level, newAccessLevel);
            await connection('users')
                .where('email', emailToChangeAccess)
                .update('access_level', access_level);
            console.log(`User ${user.name}: ${user.email} changed access level of ${emailToChangeAccess} to ${newAccessLevel}`);
            return res.json({ info: `User access level ${emailToChangeAccess} changed.` })
        } catch (err) {
            return res.status(400).json({ error: 'No connection to database', err })
        }

    }

}