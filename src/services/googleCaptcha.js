const axios = require('axios');

const connect = axios.create({
    baseURL: 'https://www.google.com/recaptcha/api/siteverify'
});
const params = new URLSearchParams();
params.append('secret', process.env.GOOGLE_CAPTCHA_PRIVATE_KEY);

module.exports = { connect, params };