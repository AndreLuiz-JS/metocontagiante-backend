const crypto = require('crypto');

module.exports = function generateUniqueId() {
    return crypto.randomBytes(32).toString('HEX');
}