import { StatusCode, context, setActiveSpan } from '@opentelemetry/api';
import { BasePlugin } from '@opentelemetry/core';
import type Telegraf from 'telegraf';
import shimmer from 'shimmer';
import path from 'path';
import { ServerResponse } from 'http';
import { Update } from 'telegraf/typings/telegram-types';

interface IPackage {
    name: string;
    version: string;
}

const telegrafBaseDir = path.dirname(path.dirname(require.resolve('telegraf')));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const telegrafVersion = (require(path.join(telegrafBaseDir, 'package.json')) as IPackage).version;

export class TelegrafPlugin extends BasePlugin<typeof Telegraf> {
    public readonly supportedVersions = ['4.*'];
    public static readonly COMPONENT = 'telegraf';

    protected readonly _basedir = telegrafBaseDir;
    protected _internalFilesList = {
        '*': {
            telegraf: 'lib/telegraf',
        },
    };

    private enabled = false;

    public constructor(public readonly moduleName: string, public readonly version: string) {
        super('@myrotvorets/opentelemetry-plugin-telegraf', '1.0.0');
    }

    protected patch(): typeof Telegraf {
        // istanbul ignore else
        if (!this.enabled && this._internalFilesExports.telegraf) {
            const proto = (this._internalFilesExports.telegraf as Record<string, ObjectConstructor>).Telegraf
                .prototype as Telegraf.Telegraf;
            shimmer.wrap(proto, 'handleUpdate', this.patchHandleUpdate);

            this.enabled = true;
        }

        return this._moduleExports;
    }

    protected unpatch(): void {
        // istanbul ignore else
        if (this.enabled && this._internalFilesExports.telegraf) {
            const proto = (this._internalFilesExports.telegraf as Record<string, ObjectConstructor>).Telegraf
                .prototype as Telegraf.Telegraf;
            shimmer.massUnwrap([proto], ['handleUpdate']);
            this.enabled = false;
        }
    }

    private readonly patchHandleUpdate = (
        original: (update: Update, webhookResponse?: ServerResponse) => Promise<void>,
    ): typeof original => {
        const self = this;
        return function handleUpdate(this: typeof Telegraf, update: Update, ...params): ReturnType<typeof original> {
            const span = self._tracer.startSpan(`telegraf.handleUpdate(${update.update_id})`);
            return context.with(setActiveSpan(context.active(), span), () =>
                original.apply(this, [update, ...params]).then(
                    (result) => {
                        span.setStatus({ code: StatusCode.OK }).end();
                        return Promise.resolve(result);
                    },
                    (error) => {
                        span.setStatus({ code: StatusCode.ERROR }).end();
                        return Promise.reject(error);
                    },
                ),
            );
        };
    };
}

export const plugin = new TelegrafPlugin(TelegrafPlugin.COMPONENT, telegrafVersion);
