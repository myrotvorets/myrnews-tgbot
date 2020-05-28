import { EnvError, makeValidator } from 'envalid';

export const portOrZero = makeValidator((input) => {
    const coerced = +input;
    if (Number.isNaN(coerced) || `${coerced}` !== `${input}` || coerced % 1 !== 0 || coerced < 0 || coerced > 65535) {
        throw new EnvError(`Invalid port input: "${input}"`);
    }

    return coerced;
}, 'portOrZero');
