import { readFile } from 'node:fs/promises';
import bugsnag from '@bugsnag/js';
import { Environment } from './environment.mjs';
import { findFile } from './utils.mjs';

export const Bugsnag = bugsnag.default;

interface PackageJson {
    name: string;
    version: string;
}

/**
 * Strictly speaking, this function is not needed.
 * However, we leave it in case in future we may need to filter out some data etc.
 */
function onError(): boolean {
    return process.env['NODE_ENV'] === 'production';
}

export async function startBugsnag(env: Environment): Promise<void> {
    let version: string | undefined;

    try {
        if (process.env['npm_package_version']) {
            version = process.env['npm_package_version'];
        } else {
            const filename = await findFile('package.json');
            const json = JSON.parse(await readFile(filename, 'utf-8')) as PackageJson;

            version = json.version;
        }
    } catch {
        version = undefined;
    }

    if (env.BUGSNAG_API_KEY) {
        Bugsnag.start({
            apiKey: env.BUGSNAG_API_KEY,
            appVersion: version,
            appType: 'bot',
            releaseStage: env.NODE_ENV,
            onError,
        });
    }
}
