
exports.up = function (knex) {
    return knex.schema.table('cells', function (table) {
        table.decimal('latitude').defaultTo(-22.8328057);
        table.decimal('longitude').defaultTo(-42.1454067);
    })
};

exports.down = function (knex) {
    return knex.schema.table('devotional', function (table) {
        table.dropColumn('latitude');
        table.dropColumn('longitude');
    })
};
