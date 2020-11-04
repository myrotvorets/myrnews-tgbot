import path from 'path';
import knex from 'knex';
// eslint-disable-next-line import/named
import { buildKnexConfig } from '../src/knexfile';

const db = knex(buildKnexConfig());

beforeAll((): Promise<unknown> => db.migrate.latest({ directory: path.join(__dirname, '..', 'src', 'migrations') }));
afterAll(() => db.destroy());

describe('Database schema', (): void => {
    beforeEach((): Promise<unknown> => db.seed.run({ directory: path.join(__dirname, 'seeds') }));

    it('should remove reactions when the corresponding post is deleted', async (): Promise<unknown> => {
        const n = await db('posts').where('post_id', 43045).delete();
        expect(n).toBeGreaterThan(0);
        return expect(db('reactions').where('post_id', 43045).count({ count: '*' })).resolves.toEqual([{ count: 0 }]);
    });
});
