const fs = require('fs');
const connection = require('../database/connection');

module.exports = {

    async index(req, res) {
        try {
            const { base64, created_at } =
                await connection('files')
                    .select('*')
                    .where('id', 'advert.pdf')
                    .first();
            return res.json({ mtime: created_at, pdf: base64 });
        } catch (err) {
            if (err) return res.status(404).json({ error: 'No pdf advert file on server.' });
        }

    },
    async post(req, res) {
        const { userId, file } = req;
        if (!file) return res.status(400).json({ error: 'No pdf file provided.' })
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();

        const { level: post_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'post_user')
            .first();
        if (user.access_level < post_level) return res.status(403).json({ error: 'No rights to post here.' });
        if (file.mimetype !== 'application/pdf') return res.status(403).json({ error: 'Invalid file type.' });
        try {
            const data =
                await connection('files')
                    .select('*')
                    .where('id', 'advert.pdf')
                    .first();
            if (!data) {
                await connection('files')
                    .insert({ id: 'advert.pdf', base64, created_at });
                return res.json({ info: 'File uploaded.' });
            }
            const base64 = file.buffer.toString('base64');

            if (base64 === data.base64) {
                console.log('files are equals')
                return res.status(200).json({ info: 'The file uploaded is equal to the storaged in the server.' });
            }
            const created_at = new Date().toISOString();
            await connection('files')
                .update({ base64, created_at })
                .where('id', 'advertd.pdf');
            return res.json({ info: 'File updated.' });
        } catch (err) {
            console.log(err);
        }
    },
    async archiveDate(req, res) {
        try {
            const { created_at } =
                await connection('files')
                    .select('created_at')
                    .where('id', 'advert.pdf')
                    .first();
            return res.json({ mtime: created_at });
        } catch (err) {
            if (err) return res.status(404).json({ error: 'No pdf advert file on server.' });
        }
    }

}

