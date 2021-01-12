/* istanbul ignore file */

import Bugsnag from '@bugsnag/js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Environment } from './environment';

interface PackageJson {
    name: string;
    version: string;
}

/**
 * Strictly speaking, this function is not needed.
 * However, we leave it in case in future we may need to filter out some data etc.
 */
function onError(): boolean {
    if (process.env.NODE_ENV !== 'production') {
        return false;
    }

    return true;
}

export async function startBugsnag(env: Environment): Promise<void> {
    const readFile = promisify(fs.readFile);
    let version: string | undefined;

    try {
        if (process.env.npm_package_version) {
            version = process.env.npm_package_version;
        } else {
            const json = JSON.parse(
                await readFile(path.join(path.dirname(require.main?.filename || __dirname), 'package.json'), 'utf-8'),
            ) as PackageJson;

            version = json.version;
        }
    } catch (e) {
        version = undefined;
    }

    if (env.BUGSNAG_API_KEY) {
        Bugsnag.start({
            apiKey: env.BUGSNAG_API_KEY || '',
            appVersion: version,
            appType: 'bot',
            releaseStage: process.env.NODE_ENV || 'development',
            onError,
        });
    }
}
