
exports.up = function (knex) {
    return knex.schema.createTable('cells', function (table) {
        table.increments('id');
        table.text('image', 1024 * 350);
        table.string('name').notNullable();
        table.string('leader').notNullable();
        table.string('phone').notNullable();
        table.string('location').notNullable();
        table.integer('weekday').notNullable();
        table.string('hour').notNullable();
        table.string('type').notNullable();
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('cells');
};
