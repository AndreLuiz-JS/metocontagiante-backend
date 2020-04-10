const express = require('express');
const routes = express.Router();
const authmiddleware = require('./middlewares/auth');

const BibleController = require("./controllers/BibleController");
const DevotionalController = require("./controllers/DevotionalController");
const UserController = require("./controllers/UserController");
const AuthController = require("./controllers/AuthController");

routes.get('/bible', BibleController.index);
routes.get('/bible/:bookName', BibleController.showBook);
routes.get('/bible/:bookName/:chapterNumber', BibleController.showChapter);
routes.get('/bible/:bookName/:chapterNumber/:verseRange', BibleController.showVerseRange);

routes.get('/devotional', DevotionalController.index);

routes.post('/user', UserController.create);
routes.post('/auth', AuthController.login);

routes.post('/devotional', authmiddleware, DevotionalController.create);

routes.get('/user', authmiddleware, UserController.index);
routes.put('/user', authmiddleware, UserController.update);

routes.patch('/user/admin', authmiddleware, UserController.changeRights)



module.exports = routes;