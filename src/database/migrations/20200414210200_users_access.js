
exports.up = function (knex) {
    return knex.schema.createTable('users_access', function (table) {
        table.integer('level').primary();
        table.string('user_type').notNullable().unique();
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('users_access');
};

