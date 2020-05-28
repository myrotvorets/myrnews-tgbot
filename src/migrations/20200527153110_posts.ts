import Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('posts', function (table: Knex.CreateTableBuilder): void {
        table.bigIncrements('post_id');
    });
}

export async function down(knex: Knex): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('This is not meant to be run in the production environment');
    }

    await knex.schema.dropTableIfExists('posts');
}
