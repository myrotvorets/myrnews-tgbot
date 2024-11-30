import { mock } from 'node:test';
import { expect } from 'chai';
import { afterEach } from 'mocha';
import { getFeaturedImageResponse, getFeaturedImageResponseBadURL } from './../../fixtures/featuredimage.mjs';
import { getPostsResponse } from './../../fixtures/posts.mjs';
import type { PostData } from '../../../src/lib/types.mjs';
import { getFeaturedImageUrl, getPosts } from '../../../src/lib/wpapi.mjs';

describe('wpapi', function () {
    afterEach(function () {
        mock.reset();
    });

    describe('getPosts', function () {
        it('should properly extract data', async function () {
            mock.method(globalThis, 'fetch', () => Promise.resolve(new Response(JSON.stringify(getPostsResponse))));

            const expected: PostData[] = [
                {
                    id: 58803,
                    link: 'https://myrotvorets.news/post-2/',
                    title: 'Post #2',
                    excerpt: 'Excerpt #2',
                    featuredMedia: 58805,
                },
                {
                    id: 58808,
                    link: 'https://myrotvorets.news/post-1/',
                    title: 'Post #1',
                    excerpt: 'Excerpt #1',
                    featuredMedia: 58817,
                },
            ];

            const post = await getPosts('https://example.test');
            return expect(post).to.deep.equal(expected);
        });
    });

    describe('getFeaturedImageURL', function () {
        it('should return image URL', async function () {
            mock.method(globalThis, 'fetch', () =>
                Promise.resolve(new Response(JSON.stringify(getFeaturedImageResponse))),
            );

            const url = await getFeaturedImageUrl('https://example.test', 43762);
            return expect(url).to.equal('https://myrotvorets.news/wp-content/uploads/2019/10/Screenshot_5-3.png');
        });

        it('should return empty URL if the original image URL is malformed', async function () {
            mock.method(globalThis, 'fetch', () =>
                Promise.resolve(new Response(JSON.stringify(getFeaturedImageResponseBadURL))),
            );

            const url = await getFeaturedImageUrl('https://example.test', 43762);
            return expect(url).to.equal('');
        });
    });
});
