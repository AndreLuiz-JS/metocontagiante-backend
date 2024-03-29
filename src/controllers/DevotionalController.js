const connection = require('../database/connection');
const expoPushNotification = require('../services/expoPushNotification');

module.exports = {
    async index(request, response) {
        const newDate = new Date();
        const now = newDate.toISOString();
        const devotionals = await connection('devotional')
            .where('available_at', '<', now)
            .andWhere('visible', true)
            .limit(30)
            .orderBy('available_at', 'desc')
            .orderBy('created_at', 'desc')
            .select('id', 'title', 'verses', 'content', 'available_at');
        return response.json(devotionals);
    },
    async listAll(req, res) {
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
        if (user.access_level < post_level) return res.status(403).json({ error: 'No access to this feature.' });

        if (user.access_level === post_level) {
            const devotionals = await connection('devotional')
                .innerJoin('users', 'users.id', 'devotional.user_id')
                .innerJoin('users_access', 'users.access_level', 'users_access.level')
                .select('devotional.id', 'title', 'verses', 'content', 'visible', 'available_at', 'created_at', 'name', 'email', 'user_type')
                .where('users.id', userId)
                .andWhere('visible', false)
                .orderBy('created_at', 'desc');

            return res.json(devotionals);
        }
        if (user.access_level > post_level) {
            const data = await connection('devotional')
                .innerJoin('users', 'users.id', 'devotional.user_id')
                .innerJoin('users_access', 'users.access_level', 'users_access.level')
                .limit(30)
                .select('devotional.id', 'title', 'verses', 'content', 'visible', 'available_at', 'created_at', 'name', 'email', 'user_type')
                .orderBy('created_at', 'desc');
            const devotionals = data.map(
                devotional => {
                    const visible = devotional.visible === 1 || devotional.visible === true;
                    return { ...devotional, visible }
                })
            return res.json(devotionals);
        }

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

        const { level: post_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'post_user')
            .first();
        if (user.access_level < post_level) return res.status(403).json({ error: 'No rights to post.' });
        if (user.access_level === post_level) {
            await connection('devotional').insert({
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
            const devotional = await connection('devotional')
                .insert({
                    user_id: userId,
                    title,
                    verses,
                    content,
                    available_at,
                    created_at,
                    visible
                });
            if ((visible === 1 || visible === true) && now >= new Date(available_at)) {
                expoPushNotification.push('#Devocional Contagiante', `${title} \n\n ${content}`, 'Devotional');
                console.log(`Notified all users devotional ${title} - ${available_at}`)
                const { id } = await connection('devotional')
                    .select('id')
                    .orderBy('created_at', 'desc')
                    .first();
                await connection('devotional')
                    .update({ notified: true })
                    .where('id', id);
            }

            if ((visible === 1 || visible === true) && now < available_at)
                expoPushNotification.activatePushNotificationInterval();

            return res.json({ id: devotional, title, verses, content, available_at })
        }

    },
    async edit(req, res) {
        const { userId } = req;
        const { id, title, verses, content, available_at, visible } = req.body;
        const now = new Date();
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();

        const { level: post_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'post_user')
            .first();

        if (user.access_level < post_level) return res.status(403).json({ error: 'No rights to change devotional.' });

        const { visible: oldVisible, notified } = await connection('devotional')
            .select('visible', 'notified')
            .where('id', id)
            .first();
        if (user.access_level === post_level) {
            const devotional = await connection('devotional')
                .update({
                    title,
                    verses,
                    content,
                    available_at,
                })
                .where('id', id)
                .andWhere('user_id', userId)
                .andWhere('visible', false);
            return res.json({ id: devotional.id, title, verses, content, available_at });
        }
        if (user.access_level > post_level) {
            const devotional = await connection('devotional')
                .update({
                    title,
                    verses,
                    content,
                    available_at,
                    visible
                })
                .where('id', id);
            if ((oldVisible === 0 || oldVisible === false)
                && (visible === 1 || visible === true)
                && now >= new Date(available_at)
                && (notified === 0 || notified === false)) {
                expoPushNotification.push('#Devocional Contagiante', `${title} \n\n ${content}`, 'Devotional');
                console.log(`Notified all users devotional ${title} - ${available_at}`);
                await connection('devotional')
                    .update({ notified: true })
                    .where('id', id);
            }
            if ((oldVisible === 0 || oldVisible === false)
                && (visible === 1 || visible === true)
                && now < new Date(available_at)
                && (notified === 0 || notified === false))
                expoPushNotification.activatePushNotificationInterval();
            return res.json({ id: devotional.id, title, verses, content, available_at });
        }
    },
    async delete(req, res) {
        const { userId } = req;
        const { id } = req.headers;
        if (!id) return res.status(404).json({ error: 'No id provided.' })
        const user = await connection('users')
            .innerJoin('users_access', 'users.access_level', 'users_access.level')
            .select('name', 'access_level', 'email', 'user_type')
            .where('id', userId)
            .first();
        const { level: master_level } = await connection('users_access')
            .select('level')
            .where('user_type', 'master_user')
            .first();

        if (user.access_level < master_level) return res.status(403).json({ error: 'No rights to delete devotional.' });

        const devotional = await connection('devotional')
            .delete()
            .where('id', id);
        if (devotional === 1) return res.json({ info: 'Deleted.' })

        return res.status(404).json({ error: 'Devotional not found.' })
    }
}
