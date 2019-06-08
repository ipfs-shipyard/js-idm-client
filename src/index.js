import signal from 'pico-signals';
import createStorage from './storage';

const SESSION_KEY = 'session';

class IdmClient {
    #storage;
    #bridge;
    #session;
    #onSessionChange = signal();

    constructor(storage, bridge, session) {
        this.#storage = storage;
        this.#bridge = bridge;
        this.#session = session;

        this.#bridge.onSessionChange(this.#handleSessionChange);
    }

    isAuthenticated() {
        return Boolean(this.#session);
    }

    async authenticate() {
        if (this.#session) {
            return this.#session;
        }

        const session = await this.#bridge.authenticate();

        await this.#storeSession(session);

        return session;
    }

    async unauthenticate() {
        if (!this.#session) {
            return;
        }

        await this.#bridge.unauthenticate(this.#session.id);

        await this.#storeSession(null);
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

    #handleSessionChange = (session) => {
        this.#session = session;

        try {
            if (!session) {
                this.#storage.remove(SESSION_KEY);
            } else {
                this.#storage.set(SESSION_KEY, session);
            }
        } catch (err) {
            console.warn('Unable to update session in the storage', err);
        }

        this.#onSessionChange.dispatch(session);
    }
}

const createClient = async (bridge) => {
    const storage = await createStorage();

    let session = await storage.get(SESSION_KEY);

    if (session) {
        const sessionValid = await bridge.isSessionValid(session.id);

        if (!sessionValid) {
            await storage.remove(SESSION_KEY);
            session = undefined;
        }
    }

    return new IdmClient(storage, bridge, session);
};

export default createClient;
