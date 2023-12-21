import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { initProcessMetrics } from '@myrotvorets/otel-utils';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';

process.env['OTEL_SERVICE_NAME'] = 'bot/myrotvorets.news';

export const configurator = new OpenTelemetryConfigurator({
    serviceName: process.env['OTEL_SERVICE_NAME'],
    instrumentations: [new HttpInstrumentation(), new KnexInstrumentation()],
});

configurator.start();
await initProcessMetrics();
