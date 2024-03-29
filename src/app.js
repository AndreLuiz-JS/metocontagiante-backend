const express = require('express');
const cors = require('cors');
const { activatePushNotificationInterval } = require('./services/expoPushNotification');
//iniciando o app
const app = express();
app.use(express.json());
app.use(cors());

activatePushNotificationInterval();

//rotas
app.use('/api', require('./routes'));
app.use(function (req, res) {
    res.status(404).json({ error: "Invalid route." })
})

module.exports = app;
