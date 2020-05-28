/* istanbul ignore file */

import Bugsnag, { Event } from '@bugsnag/js';
import fs from 'fs';
import path from 'path';
import { inspect, promisify } from 'util';
import { Environment } from './environment';

function onError(e: Event): boolean {
    if (process.env.NODE_ENV !== 'production') {
        console.error(inspect(e.errors, false, 5, false));
        return false;
    }

    return true;
}

export async function startBugsnag(env: Environment): Promise<void> {
    const readFile = promisify(fs.readFile);
    let version: string;

    if (process.env.npm_package_version) {
        version = process.env.npm_package_version;
    } else {
        const json = JSON.parse(
            await readFile(path.join(path.dirname(require.main?.filename || __dirname), 'package.json'), 'utf-8'),
        );

        version = json.version;
    }

    Bugsnag.start({
        apiKey: env.BUGSNAG_API_KEY || '',
        appVersion: version,
        appType: 'bot',
        releaseStage: process.env.NODE_ENV || 'development',
        onError,
    });
}
