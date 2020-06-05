import { EnvError } from 'envalid';
import { portOrZero } from '../lib/validators';

const validator = portOrZero();

describe('portOrZero', (): void => {
    it.each([['bad'], ['123.0'], ['-1'], ['65536'], ['null'], ['']])(
        'should reject invalid input (%s)',
        (input: string) => {
            expect(() => validator._parse(input)).toThrowError(EnvError);
        },
    );

    it('shold accept zero as port number', (): void => {
        expect(validator._parse('0')).toEqual(0);
    });

    it.each([['1'], ['100'], ['1024'], ['60000'], ['65535']])(
        'should accept valid port numbers (%s)',
        (input: string): void => {
            expect(validator._parse(input)).toEqual(+input);
        },
    );
});
