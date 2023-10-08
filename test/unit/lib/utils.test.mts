import { expect } from 'chai';
import { type TestDouble, func, matchers, replaceEsm, when } from 'testdouble';
import { generateDescription } from '../../../src/lib/utils.mjs';
import type { PostData } from '../../../src/lib/types.mjs';

describe('Utils', function () {
    describe('generateDescription', function (): void {
        it('should generate description from post data', function (): void {
            const data: PostData = {
                id: 1,
                link: 'https://example.test/?p=1',
                title: 'Some title',
                excerpt: 'Excerpt goes here',
            };

            const expected = `<a href="${data.link}">${data.title}</a>\n\n<em>${data.excerpt}</em>`;
            const actual = generateDescription(data);
            expect(actual).to.equal(expected);
        });

        it('should trim long excerpts', function (): void {
            const data: PostData = {
                id: 1,
                link: 'https://example.test/?p=1',
                title: 'Some title',
                excerpt: 'A'.repeat(1000),
            };

            const expected = `<a href="${data.link}">${data.title}</a>\n\n<em>${data.excerpt.slice(0, 950)}…</em>`;
            const actual = generateDescription(data);
            expect(actual).to.equal(expected);
        });

        it('should truncate long titles', function (): void {
            const data: PostData = {
                id: 1,
                link: 'https://example.test/?p=1',
                title: 'A'.repeat(1000),
                excerpt: 'Excerpt goes here',
            };

            const expected = `<a href="${data.link}">${data.title.slice(0, 960)}…</a>`;
            const actual = generateDescription(data);
            expect(actual).to.equal(expected);
        });

        it('should skip long links', function (): void {
            const data: PostData = {
                id: 1,
                link: `https://example.test/?p=${'1'.repeat(1000)}`,
                title: 'Title',
                excerpt: 'Excerpt goes here',
            };

            const expected = data.excerpt;
            const actual = generateDescription(data);
            expect(actual).to.equal(expected);
        });

        it('should skip long links and trim long excerpts', function (): void {
            const data: PostData = {
                id: 1,
                link: `https://example.test/?p=${'1'.repeat(1000)}`,
                title: 'Title',
                excerpt: 'A'.repeat(2000),
            };

            const expected = `${data.excerpt.slice(0, 1000)}…`;
            const actual = generateDescription(data);
            expect(actual).to.equal(expected);
        });

        it('should skip excerpt for long titles', function (): void {
            const data: PostData = {
                id: 1,
                link: `https://example.test/?p=${'1'.repeat(900)}`,
                title: 'Title',
                excerpt: 'Excerpt goes here',
            };

            const expected = `<a href="${data.link}">${data.title}</a>`;
            const actual = generateDescription(data);
            expect(actual).to.equal(expected);
        });
    });

    describe('findFile', function (): void {
        let statMock: TestDouble<typeof import('node:fs/promises').stat>;
        let findFile: typeof import('../../../src/lib/utils.mjs').findFile;

        before(async function () {
            statMock = func<typeof import('node:fs/promises').stat>();

            const promises = await import('node:fs/promises');
            await replaceEsm('node:fs/promises', {
                ...promises,
                stat: statMock,
            });

            ({ findFile } = await import('../../../src/lib/utils.mjs'));
        });

        it('should throw when the file cannot be located', function () {
            when(statMock(matchers.isA(String) as string)).thenReject(new Error());
            return expect(findFile('package.json')).to.be.rejectedWith(Error);
        });

        it('should retrieve name and version from package.json', function () {
            when(statMock(matchers.isA(String) as string)).thenResolve({ isFile: () => true });
            return expect(findFile('package.json')).to.be.fulfilled;
        });
    });
});
