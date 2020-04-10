const connection = require('../database/connection');


module.exports = {
    async index(request, response) {
        const newDate = new Date();
        const now = newDate.toISOString();
        const devotional = await connection('devotional')
            .where('available_at', '<', now)
            .limit(1)
            .orderBy('available_at', 'desc')
            .orderBy('created_at', 'desc')
            .select('*');

        return response.json(devotional[ 0 ]);
    },
    async create(request, response) {
        const { userId } = req;
        const { title, verses, content, available_at } = request.body;
        const now = new Date();
        const created_at = now.toISOString();
        const user = connection('users')
            .where('id', userId)
            .select('access_level')
            .first();
        if (user.access_level < 5) return res.status(403).json({ error: 'No rights to post.' })
        try {
            const devotional = await connection('devotional').insert({
                user_id: userId,
                title,
                verses,
                content,
                available_at,
                created_at
            })
            return response.json({ id: devotional[ 0 ], title, verses, content, available_at })
        } catch (err) {
            return res.status(400).json(err);
        }
    }
}