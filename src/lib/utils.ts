import type { InlineKeyboardButton, InlineKeyboardMarkup } from 'telegram-typings';
import { Markup } from 'telegraf';
import type { PostData, UserReactionStats } from '../types';

export const TEXT_LIKE = '👍';
export const TEXT_HEART = '❤️';
export const TEXT_SHIP = '🚢';
export const TEXT_SKULL = '☠️';

export function buildInlineKeyboardFromPost({ id, link }: PostData): InlineKeyboardButton[][] {
    return [
        [Markup.urlButton('Читати далі…', link)],
        [
            Markup.callbackButton(TEXT_LIKE, `L:${id}`),
            Markup.callbackButton(TEXT_HEART, `H:${id}`),
            Markup.callbackButton(TEXT_SHIP, `S:${id}`),
            Markup.callbackButton(TEXT_SKULL, `B:${id}`),
        ],
    ];
}

export function buildInlineKeyboardFromMarkup(
    markup: InlineKeyboardMarkup | undefined,
    { likes, hearts, ships, skulls }: UserReactionStats,
    postId: number,
): InlineKeyboardButton[][] {
    return [
        [
            markup && markup.inline_keyboard[0] && markup.inline_keyboard[0][0]
                ? markup.inline_keyboard[0][0]
                : Markup.urlButton('Читати далі…', `https://myrotvorets.news/?p=${postId}`),
        ],
        [
            Markup.callbackButton(likes ? `${TEXT_LIKE} ×${likes}` : `${TEXT_LIKE}`, `L:${postId}`),
            Markup.callbackButton(hearts ? `${TEXT_HEART} ×${hearts}` : `${TEXT_HEART}`, `H:${postId}`),
            Markup.callbackButton(ships ? `${TEXT_SHIP} ×${ships}` : `${TEXT_SHIP}`, `S:${postId}`),
            Markup.callbackButton(skulls ? `${TEXT_SKULL} ×${skulls}` : `${TEXT_SKULL}`, `B:${postId}`),
        ],
    ];
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
