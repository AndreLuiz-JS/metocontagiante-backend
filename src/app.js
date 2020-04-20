const express = require('express');
const cors = require('cors');


//iniciando o app
const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://metocontagiante.netlify.com'
}));


//rotas
app.use('/api', require('./routes'));
app.use(function (req, res, next) {
    res.status(404).json({ error: "Invalid route." })
})

module.exports = app;