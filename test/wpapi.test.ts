import * as f from 'fetch-h2';
import { getFeaturedImageResponse, getFeaturedImageResponseBadURL } from './fixtures/featuredimage';
import { getFeaturedImageUrl, getPosts } from '../src/lib/wpapi';
import { getPostsResponse } from './fixtures/posts';
import type { PostData } from '../src/lib/types';

jest.mock('fetch-h2');

const mockedFetch = f.fetch as jest.MockedFunction<typeof f.fetch>; // NOSONAR
const { Response } = jest.requireActual<typeof f>('fetch-h2');

describe('getPosts', () => {
    it('should properly extract data', () => {
        mockedFetch.mockResolvedValue(new Response(JSON.stringify(getPostsResponse)));

        const expected: PostData[] = [
            {
                id: 58808,
                link: 'https://myrotvorets.news/post-1/',
                title: 'Post #1',
                excerpt: 'Excerpt #1',
                featuredMedia: 58817,
            },
            {
                id: 58803,
                link: 'https://myrotvorets.news/post-2/',
                title: 'Post #2',
                excerpt: 'Excerpt #2',
                featuredMedia: 58805,
            },
        ];

        return expect(getPosts('https://example.test')).resolves.toEqual(expected);
    });
});

describe('getFeaturedImageURL', () => {
    it('should return image URL', () => {
        mockedFetch.mockResolvedValue(new Response(JSON.stringify(getFeaturedImageResponse)));

        return expect(getFeaturedImageUrl('https://example.test', 43762)).resolves.toBe(
            'https://myrotvorets.news/wp-content/uploads/2019/10/Screenshot_5-3.png',
        );
    });

    it('should return empty URL if the original image URL is malformed', () => {
        mockedFetch.mockResolvedValue(new Response(JSON.stringify(getFeaturedImageResponseBadURL)));

        return expect(getFeaturedImageUrl('https://example.test', 43762)).resolves.toBe('');
    });
});
