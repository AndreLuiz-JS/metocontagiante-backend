
exports.up = function (knex) {
    return knex.schema.createTable('files', function (table) {
        table.string('id').primary();
        table.text('base64', 1024 * 1024 * 7).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('files');
};
