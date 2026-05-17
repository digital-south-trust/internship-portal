/**
 * Generic fetcher utility for SWR.
 * Automatically throws an error if the response is not ok,
 * which SWR catches for the `error` state.
 */
export const fetcher = async (...args) => {
    const res = await fetch(...args);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(errorData.message || 'An error occurred while fetching the data.');
        error.info = errorData;
        error.status = res.status;
        throw error;
    }
    return res.json();
};
