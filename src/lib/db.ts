import type knex from 'knex';
import type { Post, Reaction, UserReaction, UserReactionStats } from '../types';

export function addPost(db: knex, postId: number): Promise<number[]> {
    return db<Post>('posts').insert({ post_id: postId });
}

export async function checkPostExists(db: knex, postId: number): Promise<boolean> {
    const res = await db.select<Post>('post_id').from('posts').where('post_id', postId).first();
    return res !== undefined;
}

export function getReactions(db: knex, postId: number, userId: number): Promise<UserReaction | undefined> {
    return db.select<UserReaction>().from('reactions').where({ post_id: postId, user_id: userId }).forUpdate().first();
}

export function deleteReaction(db: knex, postId: number, userId: number): Promise<number> {
    return db<UserReaction>('reactions').where({ post_id: postId, user_id: userId }).delete();
}

export function addReaction(db: knex, postId: number, userId: number, reaction: Reaction): Promise<number[]> {
    return db<UserReaction>('reactions').insert({
        post_id: postId,
        user_id: userId,
        like: reaction === 'L' ? 1 : 0,
        heart: reaction === 'H' ? 1 : 0,
        ship: reaction === 'S' ? 1 : 0,
        skull: reaction === 'B' ? 1 : 0,
    });
}

export function react(db: knex, postId: number, userId: number, reaction: Reaction): Promise<unknown> {
    return db.transaction(
        async (trx): Promise<void> => {
            const r = await getReactions(trx, postId, userId);
            if (r) {
                await deleteReaction(trx, postId, userId);
            }

            const shouldUpdate =
                !r ||
                (r.like && 'L' !== reaction) ||
                (r.heart && 'H' !== reaction) ||
                (r.ship && 'S' !== reaction) ||
                (r.skull && 'B' !== reaction);

            if (shouldUpdate) {
                await addReaction(trx, postId, userId, reaction);
            }
        },
    );
}

export async function getPostStats(db: knex, postId: number): Promise<UserReactionStats> {
    return {
        likes: 0,
        hearts: 0,
        ships: 0,
        skulls: 0,
        ...(await db('reactions')
            .sum({ likes: 'like' })
            .sum({ hearts: 'heart' })
            .sum({ ships: 'ship' })
            .sum({ skulls: 'skull' })
            .where({ post_id: postId })
            .groupBy('post_id')
            .first()),
    };
}
