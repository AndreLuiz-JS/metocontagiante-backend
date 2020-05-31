const app = require('./app');

app.listen(process.env.PORT || 3001, function () {
    app.set('url', '');
});