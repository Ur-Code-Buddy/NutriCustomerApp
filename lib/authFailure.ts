/**
 * Central handler for 401 auth failures (expired/invalid token).
 * Used by api interceptor to notify AuthContext without circular dependencies.
 */
let authFailureListeners: (() => void)[] = [];

export function emitAuthFailure() {
    authFailureListeners.forEach((listener) => listener());
}

export function onAuthFailure(listener: () => void): () => void {
    authFailureListeners.push(listener);
    return () => {
        authFailureListeners = authFailureListeners.filter((l) => l !== listener);
    };
}
