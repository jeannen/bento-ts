export * from './types';

// src/index.ts
import type { BentoConfig, BentoAPI } from './types';

let loaderPromise: Promise<BentoAPI> | null = null;
let loadError: Error | null = null;
let isLoading = false;

function injectScript(src: string, timeout: number = 30000): Promise<BentoAPI> {
    return new Promise((resolve, reject) => {
        // If bento already exists, just use it
        if (window.bento) return resolve(window.bento);

        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = src;
        
        let hasResolved = false;
        // eslint-disable-next-line prefer-const
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        
        const cleanup = (removeScript = false) => {
            window.removeEventListener('bento:ready', handleReady);
            if (timeoutId) clearTimeout(timeoutId);
            // Remove script from DOM only on error
            if (removeScript && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
        
        const handleSuccess = (api: BentoAPI) => {
            if (!hasResolved) {
                hasResolved = true;
                cleanup(false);
                resolve(api);
            }
        };
        
        const handleError = (error: Error) => {
            if (!hasResolved) {
                hasResolved = true;
                cleanup(true);
                reject(error);
            }
        };
        
        script.onerror = (ev) => {
            console.error('[BENTO] Script loading error:', ev);
            handleError(new Error(`Failed to load Bento script from ${src}. This could be due to network issues, ad blockers, or invalid site configuration.`));
        };
        
        // Listen for the bento:ready event
        const handleReady = () => {
            if (window.bento) {
                handleSuccess(window.bento);
            } else {
                handleError(new Error('Bento script loaded but did not properly initialize'));
            }
        };
        
        window.addEventListener('bento:ready', handleReady);
        
        // Set timeout for the entire loading process
        timeoutId = setTimeout(() => {
            handleError(new Error(`Bento script loading timed out after ${timeout / 1000} seconds. Please check your network connection and site configuration.`));
        }, timeout);
        
        document.head.appendChild(script);
    });
}

// -- public -----------------------------------------------------------

/**
 * Load and initialize the Bento script with the selected options.
 *
 * @param config - The configuration for loading the Bento script.
 * @returns The Bento API.
 */
export async function loadBento(config: BentoConfig): Promise<BentoAPI> {
    if (typeof window === 'undefined') return Promise.resolve({} as BentoAPI); // SSR Guard

    // If bento already exists, just return it
    if (window.bento) return Promise.resolve(window.bento);

    // If already loading, return the existing promise
    if (loaderPromise) return loaderPromise;

    // If we have a previous error and trying to reload, reset the state
    if (loadError) {
        resetBento();
    }

    // Validate siteUuid
    if (!config.siteUuid || config.siteUuid === 'undefined') {
        const error = new Error('[BENTO] Invalid or missing siteUuid. Please provide a valid site UUID from your Bento dashboard.');
        loadError = error;
        return Promise.reject(error);
    }

    const isLocalhost = window.location.hostname === 'localhost';

    if (isLocalhost) console.log(`📊 [BENTO DEV] Loading Bento script with config:`, config);

    let scriptUrl: string;
    
    if (config.useAdvancedInstallation) {
        // Advanced installation: https://app.bentonow.com/{Site Key}.js
        scriptUrl = `https://app.bentonow.com/${config.siteUuid}.js`;
    } else {
        // Simple installation: https://fast.bentonow.com?site_uuid={Site Key}
        const url = new URL(config.scriptSrc ?? 'https://fast.bentonow.com');
        url.searchParams.set('site_uuid', config.siteUuid);
        scriptUrl = url.toString();
    }

    isLoading = true;
    loaderPromise = injectScript(scriptUrl, config.timeout || 30000)
        .then((api) => {
            isLoading = false;
            loadError = null;
            
            // If using advanced installation, automatically call bento.view() after loading
            if (config.useAdvancedInstallation) {
                // Wait for bento$ to be available and call view
                if (window.bento$ && typeof window.bento$ === 'function') {
                    window.bento$(() => {
                        if (window.bento && typeof window.bento.view === 'function') {
                            window.bento.view();
                        }
                    });
                }
            }
            
            return api;
        })
        .catch((error) => {
            isLoading = false;
            loadError = error;
            loaderPromise = null;
            console.error('[BENTO] Failed to load:', error.message);
            throw error;
        });
    
    return loaderPromise;
}

// Simple alias so callers can do `bento.init(...)` if they prefer
export const init = loadBento;

/**
 * Reset the Bento loader state. Useful for retrying after a failed load.
 */
export function resetBento(): void {
    loaderPromise = null;
    loadError = null;
    isLoading = false;
}

// ------------------------------------------------------------------
// Provide a typed `bento` proxy that queues calls until the real API is ready
// ------------------------------------------------------------------
import type { BentoGlobal } from './types';

async function waitForMethod(methodName: string): Promise<BentoAPI> {
    // If we have a load error, reject immediately
    if (loadError) {
        throw new Error(`[BENTO] Cannot call '${methodName}' - Bento failed to load: ${loadError.message}`);
    }

    // Wait for bento to be available
    return new Promise((resolve, reject) => {
        // Check if method is already available
        if (window.bento && typeof (window.bento as Record<string, unknown>)[methodName] === 'function') {
            return resolve(window.bento);
        }

        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        // eslint-disable-next-line prefer-const
        let intervalId: ReturnType<typeof setInterval> | undefined;

        const cleanup = () => {
            window.removeEventListener('bento:ready', handleReady);
            if (intervalId) clearInterval(intervalId);
        };

        const checkMethod = () => {
            attempts++;
            
            // Check for load error
            if (loadError) {
                cleanup();
                reject(new Error(`[BENTO] Cannot call '${methodName}' - Bento failed to load: ${loadError.message}`));
                return;
            }

            if (window.bento && typeof (window.bento as Record<string, unknown>)[methodName] === 'function') {
                cleanup();
                console.log(`[BENTO] Method '${methodName}' is now available`);
                resolve(window.bento);
            } else if (attempts >= maxAttempts) {
                cleanup();
                const availableMethods = window.bento ? Object.keys(window.bento).filter((k) => typeof (window.bento as Record<string, unknown>)[k] === 'function') : [];
                reject(new Error(`[BENTO] Method '${methodName}' not available after 5 seconds. Available methods: ${availableMethods.join(', ')}`));
            }
        };

        // Listen for bento:ready event
        const handleReady = () => {
            cleanup();
            checkMethod();
        };
        
        window.addEventListener('bento:ready', handleReady);
        
        // Check periodically
        intervalId = setInterval(checkMethod, 100);
        
        // Start checking immediately
        checkMethod();
    });
}

export const bento: BentoGlobal = new Proxy({} as BentoGlobal, {
    get(_t, prop: PropertyKey) {
        // Return the init shortcut directly so users can call bento.init()
        if (prop === 'init') return init;

        if (typeof window === 'undefined') return () => {}; // SSR Guard

        // For getEmail, we need to call it synchronously and return the result
        // This is a special case since it returns a value immediately
        if (prop === 'getEmail') {
            return () => {
                // If window.bento exists and has getEmail, call it
                if (window.bento && typeof window.bento.getEmail === 'function') {
                    return window.bento.getEmail();
                }
                // Default to undefined if not ready
                return undefined;
            };
        }

        // For spamCheck, return a function that returns a promise
        if (prop === 'spamCheck') {
            return async (email: string) => {
                const api = await waitForMethod('spamCheck');
                return api.spamCheck(email);
            };
        }

        // All other property accesses are treated as async calls to the real API
        return (...args: unknown[]) => {
            const methodName = String(prop);

            // If we have a load error, log it and don't try to wait
            if (loadError) {
                console.error(`[BENTO] Cannot call '${methodName}' - Bento failed to load:`, loadError.message);
                console.error('[BENTO] You may need to check your site configuration or call resetBento() to retry.');
                return;
            }

            // Wait for the specific method to be available
            waitForMethod(methodName)
                .then((api) => {
                    const apiRecord = api as Record<string, unknown>;
                    const fn = apiRecord[methodName];
                    if (typeof fn === 'function') {
                        fn.apply(api, args);
                    }
                })
                .catch((error) => {
                    console.error(error.message);
                });
        };
    },
}) as BentoGlobal;

// Export the chat API helper
export function getBentoChat() {
    return window.$bentoChat;
}

// Export the load error for debugging
export function getBentoLoadError(): Error | null {
    return loadError;
}

// Export loading state for debugging
export function isBentoLoading(): boolean {
    return isLoading;
}

// Default export for convenience
export default bento;
