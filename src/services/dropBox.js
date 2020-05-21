const axios = require('axios');

const dropBox = axios.create({
    baseURL: "https://content.dropboxapi.com/2/files/"
})

module.exports = dropBox;