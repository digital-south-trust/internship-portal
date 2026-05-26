import useSWR from 'swr';
import { fetcher } from '../utils/fetcher.js';

/**
 * Custom hook for fetching users with pagination and error handling.
 * @param {number} page - The current page.
 * @param {number} limit - Items per page.
 * @param {string} search - Search query.
 * @param {string} roleFilter - Role filter.
 * @param {string} sort - Sort order.
 */
export function useUsers(page = 1, limit = 100, search = '', roleFilter = 'all', sort = 'newest') {
    const queryParams = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(roleFilter && roleFilter !== 'all' && { roleFilter }),
        ...(sort && sort !== 'newest' && { sort })
    }).toString();

    const { data, error, isLoading, mutate } = useSWR(
        `/api/admin/users?${queryParams}`,
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
