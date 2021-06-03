
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users_access').del()
    .then(function () {
      // Inserts seed entries
      return knex('users_access').insert([
        { level: -5, user_type: 'banned_user' },
        { level: 0, user_type: 'read_only_user' },
        { level: 5, user_type: 'post_user' },
        { level: 10, user_type: 'revisor_user' },
        { level: 15, user_type: 'administrator_user' },
        { level: 50, user_type: 'master_user' }
      ]);
    });
};
