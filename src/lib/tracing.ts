/* istanbul ignore file */

import { EventEmitter } from 'events';
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { KnexInstrumentation } from '@myrotvorets/opentelemetry-plugin-knex';
import { TelegrafInstrumentation } from './ot-telegraf';

if (+(process.env.ENABLE_TRACING || 0)) {
    EventEmitter.defaultMaxListeners += 5;
}

export async function configure(): Promise<void> {
    if (+(process.env.ENABLE_TRACING || 0)) {
        const configurator = new OpenTelemetryConfigurator({
            serviceName: 'bot/myrotvorets.news',
            instrumentations: [new KnexInstrumentation(), new TelegrafInstrumentation()],
        });

        await configurator.start();
    }
}
