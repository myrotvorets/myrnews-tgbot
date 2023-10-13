import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';

export const configurator = new OpenTelemetryConfigurator({
    serviceName: 'bot/myrotvorets.news',
    instrumentations: [new HttpInstrumentation(), new KnexInstrumentation()],
});

configurator.start();
