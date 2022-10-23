import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';

if (!+(process.env.ENABLE_TRACING || 0)) {
    process.env.OTEL_SDK_DISABLED = 'true';
}

export const configurator = new OpenTelemetryConfigurator({
    serviceName: 'bot/myrotvorets.news',
    instrumentations: [new HttpInstrumentation(), new KnexInstrumentation()],
});

configurator.start();
