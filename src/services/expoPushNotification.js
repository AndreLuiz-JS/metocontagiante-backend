const { Expo } = require('expo-server-sdk');
const connection = require('../database/connection');

let expo = new Expo();

async function push(title, body, page) {
    const pushTokens = await connection('expo_push_tokens')
        .select('id');
    const messages = [];
    for (let pushToken of pushTokens) {
        if (!Expo.isExpoPushToken(pushToken.id)) {
            await connection('expo_push_tokens')
                .delete()
                .where('id', pushToken.id)
            continue;
        }

        messages.push({
            to: pushToken.id,
            sound: 'default',
            title,
            body,
            data: { page },
            _displayInForeground: true,
        })
    }

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    (async () => {
        // Send the chunks to the Expo push notification service. There are
        // different strategies you could use. A simple one is to send one chunk at a
        // time, which nicely spreads the load out over time:
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                // NOTE: If a ticket contains an error code in ticket.details.error, you
                // must handle it appropriately. The error codes are listed in the Expo
                // documentation:
                // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
            } catch (error) {
                console.error({ module: 'services/expoPushNotification', error });
            }
        }
    })();
}

function activatePushNotificationInterval() {
    clearInterval();
    const intervalId = setInterval(verifyItensToPush, 60000);

    async function verifyItensToPush() {
        const now = new Date();
        const response = await connection('devotional')
            .select('id', 'available_at')
            .where('notified', false)
            .andWhere('visible', true);
        console.log(`${response.length} devotionals waiting to be notified.`)
        if (response.length === 0) clearInterval(intervalId);
        for (let devotional of response) {
            if (now > devotional.available_at) {
                const { title, content } = await connection('devotional')
                    .select('title', 'content')
                    .where('id', devotional.id)
                    .first();
                push('#Devocional Contagiante', `${title} \n\n ${content}`, 'Devotional');
                console.log(`Notified all users devotional ${title} - ${devotional.available_at}`)
                await connection('devotional')
                    .update({ notified: true })
                    .where('id', devotional.id)
            }
        }
    }
}

module.exports = { push, activatePushNotificationInterval };
