const axios = require('axios');

const files = axios.create({
    baseURL: "https://content.dropboxapi.com/2/files/"
});

const metadata = axios.create({
    baseURL: "https://api.dropboxapi.com/2/files/"
});

module.exports = { files, metadata };