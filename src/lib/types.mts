export interface Post {
    post_id: number;
}

export interface PostData {
    id: number;
    title: string;
    link: string;
    excerpt: string;
    featuredMedia?: number;
    img?: string;
}
