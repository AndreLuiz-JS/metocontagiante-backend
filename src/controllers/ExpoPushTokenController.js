const connection = require('../database/connection');
const { Expo } = require('expo-server-sdk');

module.exports = {
    async register(req, res) {
        try {
            const { token } = req.body;
            if (!Expo.isExpoPushToken(token))
                return res.status(400).json({ error: 'Invalid expo push token.' });
            const response = await connection('expo_push_tokens')
                .insert({ id: token });
            console.log(`New token added to database expo_push_token: ${token}`);
            return res.json(response);
        } catch (err) {
            if (err) return res.json({ info: 'Expo Push Token already saved on database.' });
        }

    }
}