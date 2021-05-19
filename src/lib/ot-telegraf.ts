import { SpanStatusCode, context, setSpan } from '@opentelemetry/api';
import { ServerResponse } from 'http';
import { Update } from 'typegram';
import {
    InstrumentationBase,
    InstrumentationModuleDefinition,
    InstrumentationNodeModuleDefinition,
    InstrumentationNodeModuleFile,
} from '@opentelemetry/instrumentation';
import { isWrapped } from '@opentelemetry/core';
import type Telegraf from 'telegraf';

export class TelegrafInstrumentation extends InstrumentationBase<typeof Telegraf> {
    public static readonly supportedVersions = ['4.*'];
    public static readonly COMPONENT = 'telegraf';
    public readonly x = 1;

    public constructor() {
        super('@myrotvorets/opentelemetry-plugin-telegraf', '1.0.0');
    }

    protected init(): InstrumentationModuleDefinition<typeof Telegraf>[] {
        return [
            new InstrumentationNodeModuleDefinition<typeof Telegraf>(
                'telegraf',
                TelegrafInstrumentation.supportedVersions,
                undefined,
                undefined,
                [
                    new InstrumentationNodeModuleFile<typeof Telegraf>(
                        'telegraf/lib/telegraf.js',
                        TelegrafInstrumentation.supportedVersions,
                        (moduleExports) => {
                            // eslint-disable-next-line @typescript-eslint/unbound-method
                            if (!isWrapped(moduleExports.Telegraf.prototype.handleUpdate)) {
                                this._wrap(moduleExports.Telegraf.prototype, 'handleUpdate', this.patchHandleUpdate);
                            }

                            return moduleExports;
                        },
                        (moduleExports) => {
                            if (moduleExports) {
                                this._unwrap(moduleExports.Telegraf.prototype, 'handleUpdate');
                            }
                        },
                    ),
                ],
            ),
        ];
    }

    private readonly patchHandleUpdate = (
        original: (update: Update, webhookResponse?: ServerResponse) => Promise<void>,
    ): typeof original => {
        const self = this;
        return function handleUpdate(this: typeof Telegraf, update: Update, ...params): ReturnType<typeof original> {
            const span = self.tracer.startSpan(`telegraf.handleUpdate(${update.update_id})`);
            return context.with(setSpan(context.active(), span), () =>
                original.apply(this, [update, ...params]).then(
                    (result) => {
                        span.setStatus({ code: SpanStatusCode.OK }).end();
                        return result;
                    },
                    (error) => {
                        span.setStatus({ code: SpanStatusCode.ERROR }).end();
                        throw error;
                    },
                ),
            );
        };
    };
}
