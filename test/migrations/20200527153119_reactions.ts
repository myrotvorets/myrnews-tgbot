import { Knex } from 'knex';

export function up(knex: Knex): Promise<unknown> {
    return knex.schema.createTable('reactions', (table: Knex.CreateTableBuilder) => {
        table.bigInteger('post_id').notNullable();
        table.bigInteger('user_id').notNullable();
        table.integer('like').notNullable();
        table.integer('heart').notNullable();
        table.integer('ship').notNullable();
        table.integer('skull').notNullable();

        table.primary(['post_id', 'user_id']);
        table.foreign('post_id').references('posts.post_id').onDelete('cascade');
    });
}

export function down(knex: Knex): Promise<unknown> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('This is not meant to be run in the production environment');
    }

    return knex.schema.dropTableIfExists('reactions');
}
