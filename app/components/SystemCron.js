"use client";

import { useEffect } from "react";

export function SystemCron() {
    useEffect(() => {
        let mounted = true;

        const runCron = async () => {
            if (!mounted) return;
            try {
                // Fire and forget - runs in the background
                await Promise.all([
                    fetch('/api/cron/reminders?key=ds_intern_cron_2026'),
                    fetch('/api/cron/assessment?key=ds_intern_cron_2026')
                ]);
            } catch (err) {
                console.error("System Cron execution failed:", err);
            }
        };

        // Run immediately on page load
        runCron();

        // Run every 10 minutes while the user has the tab open
        const interval = setInterval(runCron, 10 * 60 * 1000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return null; // This component doesn't render anything visually
}
