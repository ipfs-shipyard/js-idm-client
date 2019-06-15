import signal from 'pico-signals';
import { createVerifier } from 'idm-signatures';
import setupDidResolver from './did-resolver';
import createStorage from './storage';
import { NotAuthenticatedError } from './errors';

const SESSION_KEY = 'session';

class IdmClient {
    #storage;
    #app;
    #bridge;
    #session;
    #signatureVerifier;

    #onSessionChange = signal();

    constructor(storage, app, bridge, session, signatureVerifier) {
        this.#storage = storage;
        this.#app = app;
        this.#bridge = bridge;
        this.#session = session;
        this.#signatureVerifier = signatureVerifier;

        this.#bridge.onSessionChange(this.#handleBridgeSessionChange);
    }

    isAuthenticated() {
        return Boolean(this.#session);
    }

    async authenticate() {
        if (this.#session) {
            return this.#session;
        }

        const session = await this.#bridge.authenticate(this.#app);

        await this.#storeSession(session);

        this.#onSessionChange.dispatch(session);

        return session;
    }

    async unauthenticate() {
        if (!this.#session) {
            return;
        }

        await this.#bridge.unauthenticate(this.#session.id);

        await this.#storeSession(null);

        this.#onSessionChange.dispatch(null);
    }

    async sign(data, options) {
        if (!this.#session) {
            throw new NotAuthenticatedError();
        }

        const signature = await this.#bridge.sign(this.#session.id, data, options);

        const { valid, error } = await this.verifySignature(data, signature);

        if (!valid) {
            throw error;
        }

        return signature;
    }

    async verifySignature(data, signature) {
        return this.#signatureVerifier(data, signature);
    }

    getSession() {
        return this.#session;
    }

    onSessionChange(fn) {
        this.#onSessionChange.add(fn);
    }

    #storeSession = async (session) => {
        this.#session = session;

        try {
            if (!session) {
                await this.#storage.remove(SESSION_KEY);
            } else {
                await this.#storage.set(SESSION_KEY, session);
            }
        } catch (err) {
            console.warn('Unable to update session in the storage', err);
        }
    }

    #handleBridgeSessionChange = async (sessionId, session) => {
        if (!this.#session || this.#session.id !== sessionId) {
            return;
        }

        this.#session = session || undefined;

        try {
            if (!session) {
                await this.#storage.remove(SESSION_KEY);
            } else {
                await this.#storage.set(SESSION_KEY, session);
            }
        } catch (err) {
            console.warn('Unable to update session in the storage', err);
        }

        this.#onSessionChange.dispatch(session);
    }
}

const createClient = async (app, bridge, options) => {
    options = {
        ipfs: undefined,
        ...options,
    };

    const storage = await createStorage();
    const resolveDid = await setupDidResolver(options);
    const signatureVerifier = createVerifier(resolveDid);

    let session = await storage.get(SESSION_KEY);

    if (session) {
        const sessionValid = await bridge.isSessionValid(session.id);

        if (!sessionValid) {
            await storage.remove(SESSION_KEY);
            session = undefined;
        }
    }

    return new IdmClient(storage, app, bridge, session, signatureVerifier);
};

export default createClient;
