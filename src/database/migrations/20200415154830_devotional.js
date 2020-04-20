
exports.up = function (knex) {
    return knex.schema.createTable('devotional', function (table) {
        table.increments('id');
        table.string('title').notNullable();
        table.string('verses');
        table.string('content').notNullable();
        table.binary('image');
        table.boolean('visible').notNullable();
        table.string('user_id').references('id').inTable('users');
        table.timestamp('available_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('devotional');
};
