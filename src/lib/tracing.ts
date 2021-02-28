/* istanbul ignore file */

import { EventEmitter } from 'events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';

if (+(process.env.ENABLE_TRACING || 0)) {
    EventEmitter.defaultMaxListeners += 5;
}

export async function configure(): Promise<void> {
    if (+(process.env.ENABLE_TRACING || 0)) {
        const configurator = new OpenTelemetryConfigurator({
            serviceName: 'bot/myrotvorets.news',
            instrumentations: [
                {
                    plugins: {
                        knex: {
                            path: '@myrotvorets/opentelemetry-plugin-knex',
                        },
                        telegraf: {
                            path: `${__dirname}/ot-telegraf`,
                        },
                    },
                },
            ],
        });

        await configurator.start();
    }
}
