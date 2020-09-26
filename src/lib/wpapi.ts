import axios from 'axios';
import type { PostData } from '../types';

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

export async function getPosts(baseUrl: string): Promise<PostData[]> {
    const result: PostData[] = [];
    const posts = await axios.get<WPPost[]>(`${baseUrl}/wp-json/wp/v2/posts`);
    for (let i = 0; i < posts.data.length; ++i) {
        const post = posts.data[i];
        result.push({
            id: post.id,
            link: post.link,
            title: post.title.rendered,
            excerpt: post.excerpt.rendered.replace(/<[^>]+>/gu, ''),
            featuredMedia: post.featured_media,
        });
    }

    return result;
}

export async function getFeaturedImageUrl(baseUrl: string, id: number): Promise<string> {
    const media = await axios.get<WPMedia>(`${baseUrl}/wp-json/wp/v2/media/${id}`);
    const link = media.data.guid.rendered;
    try {
        const url = new URL(link);
        return url.href;
    } catch (e) {
        return '';
    }
}
