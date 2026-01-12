import { setDeviceOrientation, generateHapticFeedback, Storage, env } from '@apps-in-toss/web-framework';

// Memory cache for native storage
const storageCache = {};

/**
 * Appintos SDK wrapper for Vanilla JS environment.
 */
export const SDK = {
    /**
     * Set device orientation.
     */
    setOrientation(orientation) {
        if (env.isNative && typeof setDeviceOrientation === 'function') {
            try {
                setDeviceOrientation({ type: orientation });
            } catch (e) {
                console.warn(`[SDK] Failed to set orientation:`, e);
            }
        } else {
            console.log(`[SDK] Orientation set to ${orientation} (Browser/Simulated)`);
        }
    },

    /**
     * Trigger haptic feedback.
     */
    haptic(type = 'impactLight') {
        if (!env.isNative) return;

        const typeMap = {
            'impactLight': 'tickWeak',
            'impactMedium': 'basicWeak',
            'impactHeavy': 'basicMedium',
            'notificationSuccess': 'success',
            'notificationWarning': 'wiggle',
            'notificationError': 'error',
            'selectionChanged': 'tap'
        };

        const nativeType = typeMap[type] || 'tap';

        if (typeof generateHapticFeedback === 'function') {
            try {
                generateHapticFeedback({ type: nativeType });
            } catch (e) {
                console.warn(`[SDK] Haptic feedback failed:`, e);
            }
        }
    },

    /**
     * Native Storage wrapper with local cache (for synchronous-like access)
     */
    storage: {
        async prefetch(keys) {
            for (const key of keys) {
                try {
                    // Use Native Storage only in Native environment
                    if (env.isNative && Storage && typeof Storage.getItem === 'function') {
                        const val = await Storage.getItem(key);
                        storageCache[key] = val;
                    } else {
                        storageCache[key] = localStorage.getItem(key);
                    }
                } catch (e) {
                    console.error(`[SDK] Storage prefetch failed for ${key}:`, e);
                    storageCache[key] = localStorage.getItem(key);
                }
            }
        },

        getItem(key) {
            return storageCache[key] !== undefined ? storageCache[key] : localStorage.getItem(key);
        },

        async setItem(key, value) {
            storageCache[key] = value;
            try {
                if (env.isNative && Storage && typeof Storage.setItem === 'function') {
                    await Storage.setItem(key, value);
                } else {
                    localStorage.setItem(key, value);
                }
            } catch (e) {
                console.error(`[SDK] Storage setItem failed for ${key}:`, e);
                localStorage.setItem(key, value);
            }
        },

        async removeItem(key) {
            delete storageCache[key];
            try {
                if (env.isNative && Storage && typeof Storage.removeItem === 'function') {
                    await Storage.removeItem(key);
                } else {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error(`[SDK] Storage removeItem failed for ${key}:`, e);
                localStorage.removeItem(key);
            }
        }
    }
};
