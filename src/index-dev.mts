import './lib/tracing.mjs';

import localtunnel from 'localtunnel';

if (process.env.WEBHOOK_PORT) {
    const port = +process.env.WEBHOOK_PORT || 3001;
    const tunnel = await localtunnel({ port });
    const url = new URL(tunnel.url);
    process.env.WEBHOOK_DOMAIN = url.hostname;

    // eslint-disable-next-line no-console
    console.info(`Webhook URL: ${tunnel.url}`);

    tunnel.on('close', () => {
        process.kill(process.pid, 'SIGTERM');
    });
}

await import('./bot.mjs');
