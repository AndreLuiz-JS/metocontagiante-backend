const connection = require('../database/connection');
const generateUniqueId = require('../utils/generateUniqueId');

module.exports = {

    async index(req, res) {
        try {
            const response =
                await connection('files')
                    .select('*')
                    .whereNot('id', 'advert')
            return res.json(response);
        } catch (err) {
            if (err) return res.status(404).json({ error: 'No images file on server.' });
        }

    },
    async post(req, res) {
        const { userId, file } = req;
        if (!file) return res.status(400).json({ error: 'No image file provided.' })
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();

        const { level: revisor_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'revisor_user')
            .first();
        if (user.access_level < revisor_level) return res.status(403).json({ error: 'No rights to post here.' });
        if (!file.mimetype.startsWith('image/')) return res.status(403).json({ error: 'Invalid file type.' });
        try {
            const base64 = 'data:' + file.mimetype + ';base64,' + file.buffer.toString('base64');
            const created_at = new Date().toISOString();
            const id = generateUniqueId();
            await connection('files')
                .insert({ id, base64, created_at });

            return res.json({ id });

        } catch (err) {
            console.log(err);
        }
    },
    async delete(req, res) {
        const { userId } = req;
        const { id } = req.params;
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();

        const { level: revisor_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'revisor_user')
            .first();
        if (user.access_level < revisor_level) return res.status(403).json({ error: 'No rights to post here.' });
        const response = await connection('files')
            .delete()
            .where('id', id);
        if (response === 1) return res.json({ info: 'Deleted.' })

        return res.status(404).json({ error: 'File not found.' })
    }

}
