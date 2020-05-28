import axios from 'axios';
import { PostData } from '../types/index';

export async function getPosts(baseUrl: string): Promise<PostData[]> {
    const result: PostData[] = [];
    const posts = await axios.get(`${baseUrl}/wp-json/wp/v2/posts`);
    for (let i = 0; i < posts.data.length; ++i) {
        const post = posts.data[i];
        result.push({
            id: post.id,
            link: post.link,
            title: post.title.rendered,
            excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, ''),
            featuredMedia: post.featured_media,
        });
    }

    return result;
}

export async function getFeaturedImageUrl(baseUrl: string, id: number): Promise<string> {
    const media = await axios.get(`${baseUrl}/wp-json/wp/v2/media/${id}`);
    return media.data.guid.rendered;
}
