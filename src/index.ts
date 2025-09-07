export * from './types';

// src/index.ts
import type { BentoConfig, BentoAPI } from './types';

let loaderPromise: Promise<BentoAPI> | null = null;

function injectScript(src: string): Promise<BentoAPI> {
    return new Promise((resolve, reject) => {
        // If bento already exists, just use it
        if (window.bento) return resolve(window.bento);

        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = src;
        script.onerror = (ev) => {
            console.error(ev);
            reject(new Error(`Failed to load Bento script: ${ev.toString()}`));
        };
        
        // Listen for the bento:ready event
        const handleReady = () => {
            if (window.bento) {
                window.removeEventListener('bento:ready', handleReady);
                resolve(window.bento);
            } else {
                reject(new Error('Bento did not attach to window'));
            }
        };
        
        window.addEventListener('bento:ready', handleReady);
        
        // Fallback timeout in case event doesn't fire
        setTimeout(() => {
            if (window.bento) {
                window.removeEventListener('bento:ready', handleReady);
                resolve(window.bento);
            }
        }, 5000);
        
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

    loaderPromise = injectScript(scriptUrl);
    
    // If using advanced installation, automatically call bento.view() after loading
    if (config.useAdvancedInstallation) {
        loaderPromise = loaderPromise.then((api) => {
            // Wait for bento$ to be available and call view
            if (window.bento$ && typeof window.bento$ === 'function') {
                window.bento$(() => {
                    if (window.bento && typeof window.bento.view === 'function') {
                        window.bento.view();
                    }
                });
            }
            return api;
        });
    }
    
    return loaderPromise;
}

// Simple alias so callers can do `bento.init(...)` if they prefer
export const init = loadBento;

// ------------------------------------------------------------------
// Provide a typed `bento` proxy that queues calls until the real API is ready
// ------------------------------------------------------------------
import type { BentoGlobal } from './types';

async function waitForMethod(methodName: string): Promise<BentoAPI> {
    // Wait for bento to be available
    return new Promise((resolve, reject) => {
        // Check if method is already available
        if (window.bento && typeof (window.bento as Record<string, unknown>)[methodName] === 'function') {
            return resolve(window.bento);
        }

        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        const checkMethod = () => {
            if (window.bento && typeof (window.bento as Record<string, unknown>)[methodName] === 'function') {
                console.log(`[BENTO] Method '${methodName}' is now available`);
                resolve(window.bento);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkMethod, 100);
            } else {
                const availableMethods = window.bento ? Object.keys(window.bento).filter((k) => typeof (window.bento as Record<string, unknown>)[k] === 'function') : [];
                reject(new Error(`[BENTO] Method '${methodName}' not available after 5 seconds. Available methods: ${availableMethods.join(', ')}`));
            }
        };

        // Listen for bento:ready event
        const handleReady = () => {
            window.removeEventListener('bento:ready', handleReady);
            checkMethod();
        };
        
        window.addEventListener('bento:ready', handleReady);
        
        // Start checking immediately in case already loaded
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

// Default export for convenience
export default bento;
