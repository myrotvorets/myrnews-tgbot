import { Knex } from 'knex';

const seedData = [{ post_id: 43045 }, { post_id: 43051 }, { post_id: 43063 }, { post_id: 43084 }, { post_id: 43091 }];

export async function seed(db: Knex): Promise<void> {
    await db('posts').del();
    await db('posts').insert(seedData);
}
