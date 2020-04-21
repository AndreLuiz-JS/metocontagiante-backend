
exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('token');
        table.boolean('change_pwd').defaultTo(false);
        table.integer('access_level').references('level').inTable('users_access').defaultTo(0);
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('users');
};
