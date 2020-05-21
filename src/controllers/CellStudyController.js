const connection = require('../database/connection');
const dropBox = require('../services/dropBox');
const { Authorization } = require('../secrets/dropBox.json');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('base64');

module.exports = {

    async index(req, res) {
        try {
            const response = await dropBox.files.post('download', null,
                {
                    responseType: 'arraybuffer',
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Authorization": Authorization,
                        'Dropbox-API-Arg': '{"path":"/cell/Estudo_de_Celula_Metodista_Contagiante.pdf"}',
                    }
                }
            );
            const { created_at: mtime, base64: hash } =
                await connection('files')
                    .select('*')
                    .where('id', 'cellstudy')
                    .first();
            const pdf = decoder.write(response.data);
            return res.json({ mtime, pdf, hash });
        } catch (err) {
            console.log(err);
            if (err) return res.status(404).json({ error: 'File not found.' });
        }

    },
    async getFile(req, res) {
        try {
            const response = await dropBox.metadata.post('get_temporary_link',
                {
                    path: '/cell/Estudo_de_Celula_Metodista_Contagiante.pdf'
                },
                {
                    headers: {
                        "Authorization": Authorization,
                    }
                }
            );
            const { link } = response.data;
            return res.redirect(link);
        } catch (err) {
            console.log(err);
            if (err) return res.status(404).json({ error: 'File not found.' });
        }
    },
    async post(req, res) {
        const { userId, file } = req;
        if (!file) return res.status(400).json({ error: 'No file provided.' })
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
            const { content_hash: base64 } = (await dropBox.files.post('upload?arg={"path":"/cell/Estudo_de_Celula_Metodista_Contagiante.pdf","mode":{".tag":"overwrite"},    "autorename":false,"mute":false,"strict_conflict":false}', file.buffer, {
                headers: {
                    Authorization,
                    "Content-Type": "application/octet-stream"
                }
            })).data;
            const data =
                await connection('files')
                    .select('*')
                    .where('id', 'cellstudy')
                    .first();
            const created_at = new Date().toISOString();
            if (!data) {
                await connection('files')
                    .insert({ id: 'cellstudy', base64, created_at });
                return res.json({ info: 'File uploaded.' });
            }
            await connection('files')
                .update({ base64, created_at })
                .where('id', 'cellstudy');
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
                    .where('id', 'cellstudy')
                    .first();
            return res.json({ mtime: created_at });
        } catch (err) {
            console.log(err)
            if (err) return res.status(404).json({ error: 'No file on server.' });
        }
    }

}

