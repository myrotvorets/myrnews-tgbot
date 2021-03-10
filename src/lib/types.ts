import type { Knex } from 'knex';
import type { Context } from 'telegraf';

export interface Post {
    post_id: number;
}

export interface UserReaction {
    post_id: number;
    user_id: number;
    like: number;
    heart: number;
    ship: number;
    skull: number;
}

export interface UserReactionStats {
    likes: number;
    hearts: number;
    ships: number;
    skulls: number;
}

export interface PostUserIds {
    post_id: number;
    user_id: number;
}

export interface PostData {
    id: number;
    title: string;
    link: string;
    excerpt: string;
    featuredMedia?: number;
    img?: string;
}

export type Reaction = 'L' | 'H' | 'S' | 'B';

export interface BotContext extends Context {
    db: Knex;
}
