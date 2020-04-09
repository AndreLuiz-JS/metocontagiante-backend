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
        const { title, verses, content, available_at } = request.body;
        const now = new Date();
        const created_at = now.toISOString();

        console.log(request.body);
        const devotional = await connection('devotional').insert({
            title,
            verses,
            content,
            available_at,
            created_at
        })
        return response.json({ id: devotional[ 0 ], title, verses, content, available_at })
    }
}