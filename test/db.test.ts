import path from 'path';
import knex from 'knex';
// eslint-disable-next-line import/named
import { buildKnexConfig } from '../src/knexfile';
import type { Post, Reaction, UserReaction } from '../src/lib/types';
import {
    addPost,
    addReaction,
    checkPostExists,
    deleteReaction,
    getPostStats,
    getReactions,
    react,
} from '../src/lib/db';

const db = knex(buildKnexConfig());

beforeAll(
    (): Promise<unknown> =>
        db.migrate
            .latest({ directory: path.join(__dirname, '..', 'src', 'migrations') })
            .then((): Promise<unknown> => db.seed.run({ directory: path.join(__dirname, 'seeds') })),
);

afterAll(() => db.destroy());

describe('addPost()', (): void => {
    let trx: knex.Transaction;

    beforeEach(
        async (): Promise<void> => {
            trx = await db.transaction();
        },
    );

    it('should insert a new row', async (): Promise<unknown> => {
        await addPost(trx, 1);
        return expect(
            trx.select<Post>('post_id').from('posts').where('post_id', 1).first(),
        ).resolves.not.toBeUndefined();
    });

    afterEach((): Promise<unknown> => trx.rollback());
});

describe('checkPostExists()', (): void => {
    it('should return true when the post exists', (): Promise<unknown> => {
        return expect(checkPostExists(db, 43045)).resolves.toBe(true);
    });

    it('should return false when the post does not exist', (): Promise<unknown> => {
        return expect(checkPostExists(db, 0)).resolves.toBe(false);
    });
});

describe('getReactions()', (): void => {
    it('should return undefined when (user_id, post_id) pair does not exist', (): Promise<unknown> => {
        return expect(
            db.transaction(
                (trx): Promise<unknown> => {
                    return getReactions(trx, 0, 0);
                },
            ),
        ).resolves.toBeUndefined();
    });

    it('should return (user_id, post_id) when a reaction exists', (): Promise<unknown> => {
        return expect(
            db.transaction(
                (trx): Promise<unknown> => {
                    return getReactions(trx, 43045, 1);
                },
            ),
        ).resolves.toEqual({ post_id: 43045, user_id: 1, like: 0, heart: 0, ship: 0, skull: 1 });
    });
});

describe('deleteReaction()', (): void => {
    let trx: knex.Transaction;

    beforeEach(
        async (): Promise<void> => {
            trx = await db.transaction();
        },
    );

    it('should delete the matching row', async (): Promise<unknown> => {
        const n = await deleteReaction(trx, 43045, 1);
        expect(n).toBeGreaterThan(0);
        return expect(
            trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 1 }).first(),
        ).resolves.toBeUndefined();
    });

    afterEach((): Promise<unknown> => trx.rollback());
});

describe('addReaction()', (): void => {
    let trx: knex.Transaction;

    beforeEach(
        async (): Promise<void> => {
            trx = await db.transaction();
        },
    );

    it('should insert a new row', async (): Promise<unknown> => {
        await addReaction(trx, 43045, 5, 'L');
        return expect(
            trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 5 }).first(),
        ).resolves.toEqual({
            post_id: 43045,
            user_id: 5,
            like: 1,
            heart: 0,
            ship: 0,
            skull: 0,
        });
    });

    afterEach((): Promise<unknown> => trx.rollback());
});

describe('react()', (): void => {
    let trx: knex.Transaction;

    beforeEach(
        async (): Promise<void> => {
            trx = await db.transaction();
        },
    );

    it.each<Reaction[]>([['L'], ['H'], ['S'], ['B']])(
        'should insert a new row if there is no reaction for (user_id, post_id) (%s)',
        async (reaction): Promise<unknown> => {
            // Make sure the row does not exist
            expect(
                await trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 100 }).first(),
            ).toBeUndefined();

            await react(trx, 43045, 100, reaction);

            return expect(
                trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 100 }).first(),
            ).resolves.toEqual({
                post_id: 43045,
                user_id: 100,
                like: reaction === 'L' ? 1 : 0,
                heart: reaction === 'H' ? 1 : 0,
                ship: reaction === 'S' ? 1 : 0,
                skull: reaction === 'B' ? 1 : 0,
            });
        },
    );

    it('should remove the row when reaction is removed', async (): Promise<unknown> => {
        // Make sure the row exists
        expect(
            await trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 3 }).first(),
        ).toEqual({ post_id: 43045, user_id: 3, like: 0, heart: 0, ship: 0, skull: 1 });

        await react(trx, 43045, 3, 'B');

        return expect(
            trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 3 }).first(),
        ).resolves.toBeUndefined();
    });

    // All reactions except B because B is the existing reaction
    it.each<Reaction[]>([['L'], ['H'], ['S']])(
        'should update the row with the new reaction (%s)',
        async (reaction): Promise<unknown> => {
            // Make sure the row exists
            expect(
                await trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 3 }).first(),
            ).toEqual({ post_id: 43045, user_id: 3, like: 0, heart: 0, ship: 0, skull: 1 });

            await react(trx, 43045, 3, reaction);

            return expect(
                trx.select<UserReaction>().from('reactions').where({ post_id: 43045, user_id: 3 }).first(),
            ).resolves.toEqual({
                post_id: 43045,
                user_id: 3,
                like: reaction === 'L' ? 1 : 0,
                heart: reaction === 'H' ? 1 : 0,
                ship: reaction === 'S' ? 1 : 0,
                skull: 0,
            });
        },
    );

    afterEach((): Promise<unknown> => trx.rollback());
});

describe('getPostStats()', (): void => {
    it('should count reactions correctly', (): Promise<unknown> => {
        return expect(getPostStats(db, 43045)).resolves.toEqual({
            likes: 1,
            hearts: 0,
            ships: 0,
            skulls: 2,
        });
    });

    it('should return all zeros if there are no reactions at all', (): Promise<unknown> => {
        return expect(getPostStats(db, 43091)).resolves.toEqual({
            likes: 0,
            hearts: 0,
            ships: 0,
            skulls: 0,
        });
    });
});
