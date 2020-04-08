const express = require('express');
const routes = express.Router();

const BibleController = require("./controllers/BibleController");
const DevotionalController = require("./controllers/DevotionalController");

routes.get('/bible', BibleController.index);
routes.get('/bible/:bookName', BibleController.showBook);
routes.get('/bible/:bookName/:chapterNumber', BibleController.showChapter);

routes.get('/devotional', DevotionalController.index);
routes.post('/devotional', DevotionalController.create);

module.exports = routes;