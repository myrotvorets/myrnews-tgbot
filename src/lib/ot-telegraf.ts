import { SpanStatusCode, context, setSpan } from '@opentelemetry/api';
import type Telegraf from 'telegraf';
import { ServerResponse } from 'http';
import { Update } from 'typegram';
import {
    InstrumentationBase,
    InstrumentationModuleDefinition,
    InstrumentationNodeModuleDefinition,
    InstrumentationNodeModuleFile,
} from '@opentelemetry/instrumentation';
import { isWrapped } from '@opentelemetry/core';

export class TelegrafPlugin extends InstrumentationBase<typeof Telegraf> {
    public readonly supportedVersions = ['4.*'];
    public static readonly COMPONENT = 'telegraf';

    public constructor() {
        super('@myrotvorets/opentelemetry-plugin-telegraf', '1.0.0');
    }

    protected init(): InstrumentationModuleDefinition<typeof Telegraf>[] {
        return [
            new InstrumentationNodeModuleDefinition<typeof Telegraf>(
                'telegraf',
                this.supportedVersions,
                undefined,
                undefined,
                [
                    new InstrumentationNodeModuleFile<typeof Telegraf.Telegraf>(
                        'telegraf/lib/telegraf.js',
                        this.supportedVersions,
                        (moduleExports) => {
                            // eslint-disable-next-line @typescript-eslint/unbound-method
                            if (!isWrapped(moduleExports.prototype.handleUpdate)) {
                                this._wrap(moduleExports.prototype, 'handleUpdate', this.patchHandleUpdate);
                            }

                            return moduleExports;
                        },
                        (moduleExports) => {
                            if (moduleExports) {
                                this._unwrap(moduleExports.prototype, 'handleUpdate');
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
