class BaseError extends Error {
    constructor(message, code, props) {
        super(message);

        Object.assign(this, {
            ...props,
            code,
            name: this.constructor.name,
        });

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}

export class StorageError extends BaseError {
    constructor(message, operation, type) {
        message = message || 'Something went wrong during storage operations';

        super(message, 'STORAGE_OPERATION', { operation, type });
    }
}

export class NotAuthenticatedError extends BaseError {
    constructor(message) {
        super(message || 'Not authenticated', 'NOT_AUTHENTICATE');
    }
}

export class UnavailableIpfsError extends BaseError {
    constructor() {
        super('IPFS node is unavailable', 'IPFS_UNAVAILABLE');
    }
}
