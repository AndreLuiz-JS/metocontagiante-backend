const express = require('express');
const cors = require('cors');


//iniciando o app
const app = express();
app.use(express.json());
app.use(cors());


//rotas
app.use('/api', require('./src/routes'));
app.use(function (req, res, next) {
    res.status(404).json({ error: "Invalid route." })
})

app.listen(process.env.PORT || 3001);