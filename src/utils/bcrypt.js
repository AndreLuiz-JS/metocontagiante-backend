const bcrypt = require('bcrypt');

module.exports = {
    async encrypt(password) {
        const hash = await bcrypt.hash(password, 10);
        return hash
    },
    async compare(hash, password) {
        const equal = await bcrypt.compare(hash, password);
        return equal
    }
}
