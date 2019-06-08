import level from 'level';
import pify from 'pify';
import { StorageError } from './utils/errors';

const createLevelDb = pify(level);
const DB_NAME = 'idm-client-db';

const defaultOptions = { valueEncoding: 'json' };

class Storage {
    #db;

    constructor(db) {
        this.#db = db;
    }

    async has(key) {
        let value;

        try {
            value = await this.#db.get(key, defaultOptions);
        } catch (err) {
            if (err.type === 'NotFoundError') {
                return false;
            }

            throw err;
        }

        return value != null;
    }

    async get(key) {
        try {
            return await this.#db.get(key, defaultOptions);
        } catch (err) {
            if (err.type === 'NotFoundError') {
                return undefined;
            }

            throw new StorageError(err.message, 'get', err.type);
        }
    }

    async set(key, value) {
        try {
            await this.#db.put(key, value, defaultOptions);
        } catch (err) {
            throw new StorageError(err.message, 'set', err.type);
        }
    }

    async remove(key) {
        try {
            await this.#db.del(key);
        } catch (err) {
            throw new StorageError(err.message, 'remove', err.type);
        }
    }

    async clear() {
        try {
            const keys = await this.#readStream({ values: false });
            const ops = keys.map((key) => ({ type: 'del', key }));

            await this.#db.batch(ops);
        } catch (err) {
            throw new StorageError(err.message, 'clear', err.type);
        }
    }

    #readStream = (options) => new Promise((resolve, reject) => {
        const result = [];

        options = {
            keys: true,
            values: true,
            ...defaultOptions,
            ...options,
        };

        this.#db.createReadStream(options)
        .on('data', (data) => {
            result.push(data);
        })
        .on('end', () => resolve(result))
        .on('error', reject);
    });
}

const createStorage = async (secret) => {
    const db = await createLevelDb(DB_NAME, {});

    return new Storage(db, secret);
};

export default createStorage;
