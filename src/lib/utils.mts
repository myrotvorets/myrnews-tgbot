import { stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { PostData } from '../lib/types.mjs';

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

function getLocations(name: string): string[] {
    const locations: string[] = [];
    if (process.argv[1]) {
        const dir = dirname(process.argv[1]);
        locations.push(join(dir, name), join(dir, '..', name));
    }

    const cwd = process.cwd();
    locations.push(join(cwd, name));

    return locations.map((item) => resolve(item));
}

async function fileExists(path: string): Promise<boolean> {
    try {
        const stats = await stat(path);
        return stats.isFile();
    } catch {
        return false;
    }
}

export async function findFile(name: string): Promise<string> {
    const locations = getLocations(name);
    for (const location of locations) {
        // eslint-disable-next-line no-await-in-loop
        if (await fileExists(location)) {
            return location;
        }
    }

    throw new Error();
}
