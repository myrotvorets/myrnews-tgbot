import type knex from 'knex';

const seedData = [
    { post_id: 43045, user_id: 1, like: 0, heart: 0, ship: 0, skull: 1 },
    { post_id: 43045, user_id: 2, like: 1, heart: 0, ship: 0, skull: 0 },
    { post_id: 43045, user_id: 3, like: 0, heart: 0, ship: 0, skull: 1 },
];

export async function seed(db: knex): Promise<void> {
    await db('reactions').del();
    await db('reactions').insert(seedData);
}
