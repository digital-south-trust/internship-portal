import useSWR from 'swr';
import { fetcher } from '../utils/fetcher.js';

/**
 * Custom hook for fetching users with pagination and error handling.
 * @param {number} page - The current page.
 * @param {number} limit - Items per page.
 */
export function useUsers(page = 1, limit = 10) {
    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/users?page=${page}&limit=${limit}`,
        fetcher,
        {
            revalidateOnFocus: false, // Prevents unnecessary refetches when switching tabs
            keepPreviousData: true,   // Keeps old data while fetching new page for smooth UI transitions
        }
    );

    return {
        users: data?.users || [],
        total: data?.total || 0,
        pages: data?.pages || 1,
        currentPage: data?.currentPage || page,
        isLoading,
        isError: error,
        mutate // Exposed to manually revalidate data after an action (e.g. updating a user)
    };
}
