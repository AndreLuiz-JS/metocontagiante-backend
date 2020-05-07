require('dotenv/config');
const jwt = require('jsonwebtoken');
const connection = require('../database/connection');
const generateUniqueId = require('../utils/generateUniqueId');
const bcrypt = require('../utils/bcrypt');

module.exports = {
    async index(req, res) {
        const { userId } = req;
        try {
            const { name, email, access_level } = await connection('users')
                .select('*')
                .where('id', userId)
                .first();
            const admin = await connection('users_access')
                .where('user_type', 'administrator_user')
                .select('level')
                .first();
            if (Number(access_level) < admin.level) return res.status(403).json({ error: 'Admin access level required.' });
            const users =
                await connection('users')
                    .innerJoin('users_access', 'users.access_level', 'users_access.level')
                    .select('name', ' email', ' access_level', 'user_type')
                    .where('access_level', '<', access_level)
                    .orderBy('access_level', 'desc');
            const usersTypes = await connection('users_access')
                .select('user_type')
                .where('level', '<=', access_level)
                .orderBy('level', 'desc');

            console.log(`User ${name}: ${email} get a list of all users.`);
            return res.json({ users, usersTypes: usersTypes.map(element => element.user_type) });
        } catch (err) {
            console.log(err)
            return res.status(400).json({ error: 'Token not valid.' })
        }
    },
    async create(req, res) {
        const id = generateUniqueId();
        const { name, email, password, captcha } = req.body;
        if (!captcha) return res.status(400).json({ error: 'No captcha provided.' });
        if (!name || name.length < 2 || name.length > 30) return res.status(400).json({ error: 'Invalid name or no name provided.' });
        if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email or no email provided.' });
        if (!password || password.length < 6 || password.length > 30) return res.status(400).json({ error: 'Invalid password or no password provided.' });

        const api = require('../services/googleCaptcha');
        api.params.append('response', captcha);

        const response = await api.connect.post('', api.params);
        if (!response) return res.status(404).json({ error: `Can't verify Captcha. Google not respond.` })
        if (!response.data.success) return res.status(400).json({ error: 'Captcha error ', data: response.data });

        const hash = await bcrypt.encrypt(password);

        try {
            await connection('users').insert({
                id,
                name,
                email,
                password: hash
            });
            const token = jwt.sign({ id }, process.env.SECRET_HASH, { expiresIn: '5 days' });
            return res.json({ token })
        } catch (err) {
            return res.status(403).json({ error: `Email already registred.`, code: err.code })
        }
    },
    async update(req, res) {
        const { userId } = req;
        const { name, email, password, newPassword } = req.body;
        const user = await connection('users')
            .where('id', userId)
            .select('*')
            .first();

        if (!await bcrypt.compare(password, user.password)) return res.status(403).json({ error: 'Invalid password.' });

        if (newPassword) {
            const hash = await bcrypt.encrypt(newPassword);
            await connection('users')
                .where({ id: userId })
                .update({
                    password: hash
                });
        }
        if (email && email !== user.email) {
            const registredEmail = await connection('users')
                .select('email')
                .where('email', email)
                .first();
            if (registredEmail) return res.status(403).json({ error: 'Email já registrado' });
            await connection('users')
                .where({ id: userId })
                .update({
                    email
                });
        }
        if (name) {
            await connection('users')
                .where({ id: userId })
                .update({
                    name
                });
        }

        return res.json({ info: 'Dados atualizados.' })
    },
    async changeRights(req, res) {
        const { userId } = req;
        const { email, password, emailToChangeAccess, user_type } = req.body;
        const admin = await connection('users_access')
            .select('level')
            .where('user_type', 'administrator_user')
            .first();

        const user = await connection('users')
            .where('id', userId)
            .select('name', 'email', 'password', 'access_level')
            .first();

        if (user.access_level < admin.level) return res.status(403).json({ error: 'Forbidden' });
        if (user.email !== email) return res.status(400).json({ error: 'Email incorreto.' });
        if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'Invalid password.' });

        const newAccess = await connection('users_access')
            .select('level')
            .where('user_type', user_type)
            .first();
        if (!newAccess) return res.status(400).json({ error: 'Invalid user type.' });

        const user_level = Math.min(user.access_level, newAccess.level);
        const userToChangeRights = await connection('users')
            .where('email', emailToChangeAccess)
            .update('access_level', user_level);
        if (!userToChangeRights) return res.status(404).json({ error: 'User not found.' });
        console.log(`User ${user.name}: ${user.email} changed access level of ${emailToChangeAccess} to ${user_level}`);
        return res.json({ info: `User access level ${emailToChangeAccess} changed.` })

    }

}

function validateEmail(email) {
    if (!email) return false;
    if (email.indexOf('@') === -1) return false;

    const [ user, domain ] = email.split('@');
    if (user.length < 3) return false
    if (domain.indexOf('.') === -1) return false;

    const [ server, topDomain ] = domain.split('.');
    if (server.length < 3) return false;

    if (topDomain.length < 2) return false;

    return true;
}