import useSWR from 'swr';
import { fetcher } from '../utils/fetcher.js';

/**
 * Custom hook for fetching assessments.
 * @param {string} track - The track name to filter by.
 */
export function useAssessments(track) {
    // If track is null/undefined, SWR won't fetch (useful for conditional fetching)
    const { data, error, isLoading, mutate } = useSWR(
        track ? `/api/assessment/get-by-track?track=${encodeURIComponent(track)}` : null,
        fetcher
    );

    return {
        assessments: data || [],
        isLoading,
        isError: error,
        mutate
    };
}
