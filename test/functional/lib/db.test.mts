import { expect } from 'chai';
import * as knexpkg from 'knex';
import type { Post } from '../../../src/lib/types.mjs';
import { addPost, checkPostExists, getDB } from '../../../src/lib/db.mjs';

describe('Database', function () {
    let db: knexpkg.Knex;

    before(async function () {
        db = getDB();
        await db.migrate.latest();
        await db.seed.run();
    });

    after(function () {
        return db.destroy();
    });

    describe('addPost()', function (): void {
        let trx: knexpkg.Knex.Transaction;

        beforeEach(async function (): Promise<void> {
            trx = await db.transaction();
        });

        afterEach(function () {
            return trx.rollback();
        });

        it('should insert a new row', async function () {
            await addPost(trx, 1);
            const post = await trx.select<Post>('post_id').from('posts').where('post_id', 1).first();
            return expect(post).not.be.undefined;
        });

        it('should return an array with the new post ID', async function () {
            const result = await addPost(trx, 2);
            expect(result).to.be.an('array').that.includes(2);
        });
    });

    describe('checkPostExists()', function (): void {
        it('should return true when the post exists', async function () {
            const result = await checkPostExists(db, 43045);
            expect(result).to.be.true;
        });

        it('should return false when the post does not exist', async function () {
            const result = await checkPostExists(db, 0);
            expect(result).to.be.false;
        });
    });
});
