/**
 * Sync Utilities for Phase 1 Universal Foundations
 * Handles UUID generation and geolocation capture for activities.
 */

/**
 * Generate a unique sync UUID using the browser's crypto API.
 * Fallback to timestamp-based UUID if crypto is unavailable.
 * @returns {string} A unique identifier for syncing activities.
 */
export const generateSyncUuid = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback: timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get the current device location using the Geolocation API.
 * Wrapped in a Promise for cleaner async/await usage.
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 *   Returns coordinates on success, null if denied or unavailable.
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("[Geolocation] API not available.");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        console.warn(`[Geolocation] Permission denied or error: ${error.message}`);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000, // Cache location for 30s
      }
    );
  });
};

/**
 * Format a date to ISO 8601 string (YYYY-MM-DD).
 * @param {Date|string} date - The date to format.
 * @returns {string} Formatted date string, or today's date if invalid.
 */
export const formatDateToISO = (date = new Date()) => {
  try {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

export default {
  generateSyncUuid,
  getCurrentLocation,
  formatDateToISO,
};

