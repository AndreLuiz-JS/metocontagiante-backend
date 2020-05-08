const fs = require('fs');
const connection = require('../database/connection');

module.exports = {

    async index(req, res) {
        fs.readFile('./assets/pdf/advert.pdf', (err, content) => {
            if (err) return res.status(404).json({ error: 'No advert pdf file on server.' });
            const pdf = new Buffer.alloc(content.length, content).toString('base64');
            return res.send({ pdf });
        })
    }
    ,
    async post(req, res) {
        const { userId } = req;
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
        if (req.file.mimetype !== 'application/pdf') return res.status(403).json({ error: 'Invalid file type.' });
        fs.writeFileSync('./assets/pdf/advert.pdf', req.file.buffer)
        return res.status(200).json({ info: 'Pdf file storaged to drive.' })
    }

}