import fetch from 'node-fetch';
import type { PostData } from '../lib/types';

interface WPPost {
    id: number;
    link: string;
    title: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    };
    featured_media: number;
}

interface WPMedia {
    guid: {
        rendered: string;
    };
}

async function get<T>(url: string): Promise<T> {
    const raw = await fetch(url);
    return (await raw.json()) as T;
}

export async function getPosts(baseUrl: string): Promise<PostData[]> {
    const posts = await get<WPPost[]>(`${baseUrl}/wp-json/wp/v2/posts`);
    return posts.map(
        (post): PostData => ({
            id: post.id,
            link: post.link,
            title: post.title.rendered,
            excerpt: post.excerpt.rendered.replace(/<[^>]+>/gu, ''),
            featuredMedia: post.featured_media,
        }),
    );
}

export async function getFeaturedImageUrl(baseUrl: string, id: number): Promise<string> {
    const media = await get<WPMedia>(`${baseUrl}/wp-json/wp/v2/media/${id}`);
    const link = media.guid.rendered;
    try {
        const url = new URL(link);
        return url.href;
    } catch (e) {
        return '';
    }
}
