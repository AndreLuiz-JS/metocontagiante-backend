const express = require('express');
const routes = express.Router();
const authmiddleware = require('./middlewares/auth');

const BibleController = require("./controllers/BibleController");
const DevotionalController = require("./controllers/DevotionalController");
const UserController = require("./controllers/UserController");
const AuthController = require("./controllers/AuthController");
const GoogleCalendarController = require("./controllers/GoogleCalendarController");

routes.get('/bible', BibleController.index);
routes.get('/bible/:bookName', BibleController.showBook);
routes.get('/bible/:bookName/:chapterNumber', BibleController.showChapter);
routes.get('/bible/:bookName/:chapterNumber/:verseRange', BibleController.showVerseRange);

routes.get('/calendar', GoogleCalendarController);

routes.get('/devotional', DevotionalController.index);

routes.post('/user', UserController.create);
routes.post('/auth', AuthController.login);

//Rotas autenticadas

routes.get('/auth', authmiddleware, AuthController.index);

routes.get('/devotional/all', authmiddleware, DevotionalController.listAll);
routes.post('/devotional', authmiddleware, DevotionalController.create);
routes.put('/devotional', authmiddleware, DevotionalController.edit);
routes.delete('/devotional', authmiddleware, DevotionalController.delete);

routes.get('/user', authmiddleware, UserController.index);
routes.put('/user', authmiddleware, UserController.update);

routes.patch('/user', authmiddleware, UserController.changeRights)



module.exports = routes;