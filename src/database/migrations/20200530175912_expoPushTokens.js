
exports.up = function (knex) {
    return knex.schema.createTable('expo_push_tokens', function (table) {
        table.string('id').primary();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('expo_push_tokens');
};
