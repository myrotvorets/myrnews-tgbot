import { Markup } from 'telegraf';
import type { InlineKeyboardButton, InlineKeyboardMarkup } from 'typegram';
import type { PostData, UserReactionStats } from '../lib/types';

export const TEXT_LIKE = '👍';
export const TEXT_HEART = '❤️';
export const TEXT_SHIP = '🚢';
export const TEXT_SKULL = '☠️';

export function buildInlineKeyboardFromPost({ id, link }: PostData): InlineKeyboardButton[][] {
    return [
        [Markup.button.url('Читати далі…', link)],
        [
            Markup.button.callback(TEXT_LIKE, `L:${id}`),
            Markup.button.callback(TEXT_HEART, `H:${id}`),
            Markup.button.callback(TEXT_SHIP, `S:${id}`),
            Markup.button.callback(TEXT_SKULL, `B:${id}`),
        ],
    ] as InlineKeyboardButton[][];
}

export function buildInlineKeyboardFromMarkup(
    markup: InlineKeyboardMarkup | undefined,
    { likes, hearts, ships, skulls }: UserReactionStats,
    postId: number,
): InlineKeyboardButton[][] {
    return [
        [markup?.inline_keyboard?.[0]?.[0] ? markup.inline_keyboard[0][0] : Markup.button.url('', '#')],
        [
            Markup.button.callback(likes ? `${TEXT_LIKE} ×${likes}` : `${TEXT_LIKE}`, `L:${postId}`),
            Markup.button.callback(hearts ? `${TEXT_HEART} ×${hearts}` : `${TEXT_HEART}`, `H:${postId}`),
            Markup.button.callback(ships ? `${TEXT_SHIP} ×${ships}` : `${TEXT_SHIP}`, `S:${postId}`),
            Markup.button.callback(skulls ? `${TEXT_SKULL} ×${skulls}` : `${TEXT_SKULL}`, `B:${postId}`),
        ],
    ] as InlineKeyboardButton[][];
}

export function generateDescription({ link, title, excerpt }: PostData): string {
    const a = `<a href="${link}">${title}</a>`;
    if (a.length > 1000) {
        const base = `<a href="${link}"></a>`;
        const remLen = 1000 - base.length;
        if (remLen <= 50) {
            const description = excerpt.slice(0, 1000);
            const ellipsis = description === excerpt ? '' : '…';
            return `${description}${ellipsis}`;
        }

        const t = title.slice(0, remLen);
        return `<a href="${link}">${t}…</a>`;
    }

    const len = 1000 - a.length;
    if (len >= 100) {
        const description = excerpt.slice(0, len);
        const ellipsis = description === excerpt ? '' : '…';
        return `${a}\n\n<em>${description}${ellipsis}</em>`;
    }

    return a;
}
