require('dotenv/config');
const generateUniqueId = require('../../utils/generateUniqueId');
const connection = require('../connection');
const bcrypt = require('../../utils/bcrypt');

exports.seed = async function (knex) {
  const { MASTER_NAME, MASTER_EMAIL, MASTER_PASSWORD } = process.env;
  const password = await bcrypt.encrypt(MASTER_PASSWORD);
  const id = generateUniqueId();
  const { level } =
    await connection('users_access')
      .select('level')
      .orderBy('level', 'desc')
      .first();
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert(
        { id, name: MASTER_NAME, email: MASTER_EMAIL, password, access_level: level }
      );
    });
};
