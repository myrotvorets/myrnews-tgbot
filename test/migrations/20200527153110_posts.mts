import type { Knex } from 'knex';

export function up(db: Knex): Promise<unknown> {
    return db.schema.createTable('posts', (table: Knex.CreateTableBuilder) => {
        table.bigIncrements('post_id');
    });
}

export function down(knex: Knex): Promise<unknown> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('This is not meant to be run in the production environment');
    }

    return knex.schema.dropTableIfExists('posts');
}
