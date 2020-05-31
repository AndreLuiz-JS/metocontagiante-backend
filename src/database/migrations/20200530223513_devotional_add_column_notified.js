
exports.up = function (knex) {
    return knex.schema.table('devotional', function (table) {
        table.boolean('notified').defaultTo(false);
    })
};

exports.down = function (knex) {
    return knex.schema.table('devotional', function (table) {
        table.dropColumn('notified')
    })
};
