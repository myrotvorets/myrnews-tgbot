import { InlineKeyboardMarkup } from 'telegram-typings';
import { buildInlineKeyboardFromMarkup, buildInlineKeyboardFromPost, generateDescription } from '../lib/utils';
import { PostData, UserReactionStats } from '../types';

describe('buildInlineKeyboardFromPost()', (): void => {
    const post = {
        id: 1,
        link: 'https://example.test/',
        excerpt: 'Excerpt',
        title: 'Title',
    };

    const kbd = buildInlineKeyboardFromPost(post);

    it('should have two rows', () => {
        expect(kbd).toHaveLength(2);
    });

    describe('the first row', (): void => {
        it('should have one button, the button should be a link', (): void => {
            expect(kbd[0]).toHaveLength(1);
            expect(kbd[0][0]).toHaveProperty('url');
            expect(kbd[0][0]).toMatchObject({ url: post.link });
        });
    });

    describe('the second row', (): void => {
        it('should have four buttons, the buttons should be callback buttons', (): void => {
            const expectedData = [`L:${post.id}`, `H:${post.id}`, `S:${post.id}`, `B:${post.id}`];
            expect(kbd[1]).toHaveLength(expectedData.length);

            for (let i = 0; i < expectedData.length; ++i) {
                expect(kbd[1][i]).toHaveProperty('callback_data');
                expect(kbd[1][i]).toMatchObject({ callback_data: expectedData[i] });
            }
        });
    });
});

describe('buildInlineKeyboardFromMarkup()', (): void => {
    const stats: UserReactionStats = {
        likes: 1,
        hearts: 2,
        ships: 3,
        skulls: 4,
    };

    const zeros: UserReactionStats = {
        likes: 0,
        hearts: 0,
        ships: 0,
        skulls: 0,
    };

    const markup: InlineKeyboardMarkup = {
        inline_keyboard: [
            [{ text: 'Читати далі…', url: 'https://example.test/' }],
            [
                { text: '👍', callback_data: 'L:1' },
                { text: '❤️', callback_data: 'H:1' },
                { text: '🚢', callback_data: 'S:1' },
                { text: '☠️', callback_data: 'B:1' },
            ],
        ],
    };

    it.each([[undefined], [markup]])('should generate the proper markup', (markup): void => {
        const actual = buildInlineKeyboardFromMarkup(markup, stats, 1);

        expect(actual).toHaveLength(2);
        expect(actual[0]).toHaveLength(1);
        expect(actual[0][0]).toHaveProperty('url');
        expect(actual[1]).toHaveLength(4);
        for (let i = 0; i < actual[0].length; ++i) {
            expect(actual[1][i]).toHaveProperty('callback_data');
        }
    });

    it('should use URL from the original markup', (): void => {
        const actual = buildInlineKeyboardFromMarkup(markup, stats, 1);
        expect(actual).toHaveLength(2);
        expect(actual[0]).toHaveLength(1);
        expect(actual[0][0]).toHaveProperty('url');
        expect(actual[0][0].url).toEqual(markup.inline_keyboard[0][0].url);
    });

    it('should generate URL if markup is undefined', (): void => {
        const actual = buildInlineKeyboardFromMarkup(undefined, stats, 1);
        expect(actual).toHaveLength(2);
        expect(actual[0]).toHaveLength(1);
        expect(actual[0][0]).toHaveProperty('url');
        expect(actual[0][0].url).toMatch(/\?p=1$/);
    });

    describe('reaction buttons', (): void => {
        it('should have no × for zeros', (): void => {
            const actual = buildInlineKeyboardFromMarkup(markup, zeros, 1);

            expect(actual).toHaveLength(2);
            expect(actual[1]).toHaveLength(4);
            for (let i = 0; i < actual[0].length; ++i) {
                expect(actual[1][i]).toHaveProperty('text');
                expect(actual[1][i].text).not.toMatch('×');
            }
        });

        it('should have × for non-zero reactions', (): void => {
            const actual = buildInlineKeyboardFromMarkup(markup, stats, 1);

            expect(actual).toHaveLength(2);
            expect(actual[1]).toHaveLength(4);
            for (let i = 0; i < actual[0].length; ++i) {
                expect(actual[1][i]).toHaveProperty('text');
                expect(actual[1][i].text).toMatch('×');
            }
        });
    });
});

describe('generateDescription', (): void => {
    it('should generate description from post data', (): void => {
        const data: PostData = {
            id: 1,
            link: 'https://example.test/?p=1',
            title: 'Some title',
            excerpt: 'Excerpt goes here',
        };

        const expected = `<a href="${data.link}">${data.title}</a>\n\n<em>${data.excerpt}</em>`;
        const actual = generateDescription(data);
        expect(actual).toEqual(expected);
    });

    it('should trim long excerpts', (): void => {
        const data: PostData = {
            id: 1,
            link: 'https://example.test/?p=1',
            title: 'Some title',
            excerpt: 'A'.repeat(1000),
        };

        const expected = `<a href="${data.link}">${data.title}</a>\n\n<em>${data.excerpt.slice(0, 950)}…</em>`;
        const actual = generateDescription(data);
        expect(actual).toEqual(expected);
    });

    it('should truncate long titles', (): void => {
        const data: PostData = {
            id: 1,
            link: 'https://example.test/?p=1',
            title: 'A'.repeat(1000),
            excerpt: 'Excerpt goes here',
        };

        const expected = `<a href="${data.link}">${data.title.slice(0, 960)}…</a>`;
        const actual = generateDescription(data);
        expect(actual).toEqual(expected);
    });

    it('should skip long links', (): void => {
        const data: PostData = {
            id: 1,
            link: 'https://example.test/?p=' + '1'.repeat(1000),
            title: 'Title',
            excerpt: 'Excerpt goes here',
        };

        const expected = data.excerpt;
        const actual = generateDescription(data);
        expect(actual).toEqual(expected);
    });

    it('should skip long links and trim long excerpts', (): void => {
        const data: PostData = {
            id: 1,
            link: 'https://example.test/?p=' + '1'.repeat(1000),
            title: 'Title',
            excerpt: 'A'.repeat(2000),
        };

        const expected = data.excerpt.slice(0, 1000) + '…';
        const actual = generateDescription(data);
        expect(actual).toEqual(expected);
    });

    it('should skip excerpt for long titles', (): void => {
        const data: PostData = {
            id: 1,
            link: 'https://example.test/?p=' + '1'.repeat(900),
            title: 'Title',
            excerpt: 'Excerpt goes here',
        };

        const expected = `<a href="${data.link}">${data.title}</a>`;
        const actual = generateDescription(data);
        expect(actual).toEqual(expected);
    });
});
