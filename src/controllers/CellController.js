const connection = require('../database/connection');

module.exports = {
    async index(request, response) {
        const cells = await connection('cells')
            .select('*');

        return response.json(cells);
    },
    async create(req, res) {
        const { userId } = req;
        const { image, name, leader, phone, location, weekday, hour, type } = req.body;
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();
        if (image.lenght > 300) return res.status(403).json({ error: 'Image must be 300k or lower' });
        const { level: administrator_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'administrator_user')
            .first();
        if (user.access_level < administrator_level) return res.status(403).json({ error: 'No rights to add new cell.' });
        if (user.access_level >= administrator_level) {
            const cell = await connection('cells').insert({
                image,
                name,
                leader,
                phone,
                location,
                weekday,
                hour,
                type
            });
            return res.json(cell)
        }

    },
    async edit(req, res) {
        const { userId } = req;
        const { image, name, leader, phone, location, weekday, hour, type } = req.body;
        const { id } = req.params;
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();

        const { level: administrator_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'administrator_user')
            .first();

        if (user.access_level < administrator_level) return res.status(403).json({ error: 'No rights to change cell.' });

        if (user.access_level >= administrator_level) {
            const cell = await connection('cells')
                .update({
                    image,
                    name,
                    leader,
                    phone,
                    location,
                    weekday,
                    hour,
                    type
                })
                .where('id', id);
            return res.json(cell);
        }
    },
    async delete(req, res) {
        const { userId } = req;
        const { id } = req.params;
        if (!id) return res.status(404).json({ error: 'No id provided.' })
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();
        if (!user) return res.status(403).json({ error: 'Invalid credentials.' });
        const { level: administrator_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'administrator_user')
            .first();

        if (user.access_level < administrator_level) return res.status(403).json({ error: 'No rights to delete cell.' });

        const cell = await connection('cells')
            .delete()
            .where('id', id);
        if (cell === 1) return res.json({ info: 'Cell deleted.' })

        return res.status(404).json({ error: 'Cell not found.' })
    }
}
