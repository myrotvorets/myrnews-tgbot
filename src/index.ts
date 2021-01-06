import { configure } from './lib/tracing';

void (async (): Promise<void> => {
    try {
        await configure();
        require('./bot');
    } catch (e) {
        console.error('Failed to initialize OpenTelemetry:', e);
    }
})();
