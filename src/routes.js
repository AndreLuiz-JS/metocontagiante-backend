const express = require('express');
const routes = express.Router();
const authmiddleware = require('./middlewares/auth');
const multer = require('multer')
const upload = multer({
    buffer: './assets/pdf',
    mimetype: 'application/pdf',
});

const BibleController = require("./controllers/BibleController");
const DevotionalController = require("./controllers/DevotionalController");
const CellController = require("./controllers/CellController");
const UserController = require("./controllers/UserController");
const AuthController = require("./controllers/AuthController");
const GoogleCalendarController = require("./controllers/GoogleCalendarController");
const GooglePhotosController = require("./controllers/GooglePhotosController");
const AdvertController = require("./controllers/AdvertController");

routes.get('/bible', BibleController.index);
routes.get('/bible/:bookName', BibleController.showBook);
routes.get('/bible/:bookName/:chapterNumber', BibleController.showChapter);
routes.get('/bible/:bookName/:chapterNumber/:verseRange', BibleController.showVerseRange);

routes.get('/calendar', GoogleCalendarController);

routes.get('/photos', GooglePhotosController.index);
routes.get('/photos/:id', GooglePhotosController.listAlbum);

routes.get('/devotional', DevotionalController.index);
routes.get('/cells', CellController.index);

routes.post('/user', UserController.create);
routes.post('/auth', AuthController.login);

routes.get('/advert', AdvertController.index)
routes.get('/advert/time', AdvertController.archiveDate)

//Rotas autenticadas

routes.get('/auth', authmiddleware, AuthController.index);

routes.get('/devotional/all', authmiddleware, DevotionalController.listAll);
routes.post('/devotional', authmiddleware, DevotionalController.create);
routes.put('/devotional', authmiddleware, DevotionalController.edit);
routes.delete('/devotional', authmiddleware, DevotionalController.delete);

routes.post('/cell', authmiddleware, CellController.create);
routes.put('/cell/:id', authmiddleware, CellController.edit);
routes.delete('/cell/:id', authmiddleware, CellController.delete);

routes.get('/user', authmiddleware, UserController.index);
routes.put('/user', authmiddleware, UserController.update);

routes.patch('/user', authmiddleware, UserController.changeRights)

routes.post('/advert', authmiddleware, upload.single('file'), AdvertController.post)


module.exports = routes;