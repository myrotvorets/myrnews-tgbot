import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('reactions', function (table: Knex.CreateTableBuilder): void {
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

export async function down(knex: Knex): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('This is not meant to be run in the production environment');
    }

    await knex.schema.dropTableIfExists('reactions');
}
