import * as knexpkg from 'knex';
import { buildKnexConfig } from '../knexfile.mjs';
import type { Post } from '../lib/types.mjs';

let database: knexpkg.Knex | undefined = undefined;

export function getDB(): knexpkg.Knex {
    const { knex } = knexpkg.default;
    if (database === undefined || (database.client as knexpkg.Knex.Client).pool === undefined) {
        database = knex(buildKnexConfig());
    }

    return database;
}

export function addPost(db: knexpkg.Knex, postId: number): Promise<number[]> {
    return db<Post>('posts').insert({ post_id: postId });
}

export async function checkPostExists(db: knexpkg.Knex, postId: number): Promise<boolean> {
    const res = await db.select<Post>('post_id').from('posts').where('post_id', postId).first();
    return res !== undefined;
}
