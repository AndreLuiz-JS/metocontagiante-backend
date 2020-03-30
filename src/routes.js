const express = require('express');
const routes = express.Router();

const BibleController = require("./controllers/BibleController");

routes.get('/bible', BibleController.index);
routes.get('/bible/:bookName', BibleController.showBook);
routes.get('/bible/:bookName/:chapterNumber', BibleController.showChapter);

module.exports = routes;