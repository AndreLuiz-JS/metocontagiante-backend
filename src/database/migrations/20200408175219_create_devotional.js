
exports.up = function (knex) {
    return knex.schema.createTable('devotional', function (table) {
        table.increments();
        table.string('title').notNullable();
        table.string('verse').notNullable();
        table.string('content').notNullable();
        table.timestamp('available_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('devotional');
};
