import axios from 'axios';
import { getFeaturedImageResponse } from './fixtures/featuredimage';
import { getFeaturedImageUrl, getPosts } from '../src/lib/wpapi';
import { getPostsResponse } from './fixtures/posts';
import type { PostData } from '../src/types';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getPosts', (): void => {
    it('should properly extract data', async (): Promise<unknown> => {
        mockedAxios.get.mockResolvedValue({ data: getPostsResponse });

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

describe('getFeaturedImageURL', (): void => {
    it('should return image URL', async (): Promise<unknown> => {
        mockedAxios.get.mockResolvedValue({ data: getFeaturedImageResponse });

        return expect(getFeaturedImageUrl('https://example.test', 43762)).resolves.toBe(
            'https://myrotvorets.news/wp-content/uploads/2019/10/Screenshot_5-3.png',
        );
    });
});
