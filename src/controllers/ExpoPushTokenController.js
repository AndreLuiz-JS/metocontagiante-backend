const connection = require('../database/connection');
const { Expo } = require('expo-server-sdk');

module.exports = {
    async register(req, res) {
        try {
            const { token } = req.body;
            if (!Expo.isExpoPushToken(token))
                return res.status(400).json({ error: 'Invalid expo push token.' });
            const response = await connection('expoPushTokens')
                .insert({ id: token });
            return res.json(response);
        } catch (err) {
            if (err) return res.json({ info: 'Expo Push Token already saved on database.' });
        }

    }
}