const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const { google } = require('googleapis');

const SCOPES = [ 'https://www.googleapis.com/auth/photoslibrary.readonly' ];

const TOKEN_PATH = './src/secrets/googlePhotosToken.json';

module.exports = {
    async index(req, res) {
        fs.readFile('./src/secrets/googlePhotosCredentials.json', (err, content) => {
            if (err) return ('Error loading client secret file:', err);
            authorize(JSON.parse(content), listAlbums);
        })

        async function listAlbums(auth) {
            try {
                const albumList = await axios.get('https://photoslibrary.googleapis.com/v1/albums', { headers: { Authorization: 'Bearer ' + auth.credentials.access_token } });
                const { data } = albumList;
                return res.json({ albums: data.albums });
            } catch (error) {
                console.log(error.response.data);
                refreshToken(listAlbums);
            }

        }
    },
    async listAlbum(req, res) {
        const { id } = req.params;
        fs.readFile('./src/secrets/googlePhotosCredentials.json', (err, content) => {
            if (err) return ('Error loading client secret file:', err);
            authorize(JSON.parse(content), listPhotos);
        })

        async function listPhotos(auth) {
            try {
                const photoList = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:search', { "pageSize": "30", albumId: id }, { headers: { Authorization: 'Bearer ' + auth.credentials.access_token, } });
                const { data } = photoList;
                return res.json({ data });
            } catch (error) {
                console.log(error.response.data);
                refreshToken(listPhotos);
            }

        }
    }
}

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[ 0 ]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

async function refreshToken(callback) {
    const credentials = fs.readFileSync('./src/secrets/googlePhotosCredentials.json');
    const token = fs.readFileSync('./src/secrets/googlePhotosToken.json');
    const { client_id, client_secret } = JSON.parse(credentials).installed;
    const { refresh_token } = JSON.parse(token);
    try {
        const newToken = await axios.post('https://www.googleapis.com/oauth2/v4/token', { client_id, client_secret, refresh_token, grant_type: 'refresh_token' });
        const { data } = newToken;
        console.log(data);
        fs.writeFile(TOKEN_PATH, JSON.stringify({ ...data, refresh_token }), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
        authorize(JSON.parse(credentials), callback)
    } catch (err) {
        console.log(err)
    }
}
