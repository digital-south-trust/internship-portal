"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AmbassadorLoginRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to unified login page
        router.replace("/login");
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                Redirecting to Unified Authentication...
            </p>
        </div>
    );
}
