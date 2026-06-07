// src/utils/downloadUtils.js
import api from "@/services/api";

/**
 * Downloads a binary file from the API and triggers the browser's
 * native Save dialog. Works with the existing JWT interceptor.
 *
 * @param {string} apiPath - e.g. "/documents/invoice/42"
 * @param {string} filename - e.g. "invoice-42.pdf"
 * @returns {Promise<void>}
 */
export const downloadFile = async (apiPath, filename) => {
    try {
        const response = await api.get(apiPath, { responseType: "blob" });

        const contentType =
            response.headers["content-type"] || "application/octet-stream";
        const blob = new Blob([response.data], { type: contentType });
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    } catch (error) {
        // If the server returned an error, the body is also a blob.
        // Read it as text to extract the error message.
        if (error.response?.data instanceof Blob) {
            try {
                const text = await error.response.data.text();
                const parsed = JSON.parse(text);
                throw new Error(parsed.message || "Download failed.");
            } catch {
                throw new Error("Download failed. Please try again.");
            }
        }
        throw error;
    }
};