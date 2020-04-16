const connection = require('../database/connection');

module.exports = {
    async index(request, response) {
        const newDate = new Date();
        const now = newDate.toISOString();
        const devotional = await connection('devotional')
            .where('available_at', '<', now)
            .andWhere('visible', true)
            .limit(1)
            .orderBy('available_at', 'desc')
            .orderBy('created_at', 'desc')
            .select('*')
            .first();

        return response.json(devotional);
    },
    async listAll(req, res) {
        const { userId } = req;
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();
        if (!user) return res.status(403).json({ error: 'Invalid credentials.' });
        const { level: revisor_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'revisor_user')
            .first();
        if (user.access_level < revisor_level) return res.status(403).json({ error: 'No access to this feature.' });
        const devotionals = await connection('devotional')
            .innerJoin('users', 'users.id', 'devotional.user_id')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .limit(30)
            .select('devotional.id', 'title', 'verses', 'content', 'visible', 'available_at', 'created_at', 'name', 'email', 'user_type')
            .orderBy('created_at', 'desc');

        return res.json(devotionals);

    },
    async create(req, res) {
        const { userId } = req;
        const { title, verses, content, available_at, visible } = req.body;
        const now = new Date();
        const created_at = now.toISOString();
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();
        if (!user) return res.status(403).json({ error: 'Invalid credentials.' });

        const { level: post_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'post_user')
            .first();
        if (user.access_level < post_level) return res.status(403).json({ error: 'No rights to post.' });
        if (user.access_level = post_level) {
            const devotional = await connection('devotional').insert({
                user_id: userId,
                title,
                verses,
                content,
                available_at,
                created_at,
                visible: false
            });
            return res.json({ id: devotional, title, verses, content, available_at })
        }
        if (user.access_level > post_level) {
            const devotional = await connection('devotional').insert({
                user_id: userId,
                title,
                verses,
                content,
                available_at,
                created_at,
                visible
            });
            return res.json({ id: devotional, title, verses, content, available_at })
        }

    }
}