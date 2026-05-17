"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function NotFoundPage() {
  const router = useRouter();
  
  return (
    <section className="bg-white font-sans min-h-screen flex items-center justify-center">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full sm:w-10/12 md:w-8/12 text-center">
            <div
              className="bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] h-[250px] sm:h-[350px] md:h-[400px] bg-center bg-no-repeat bg-contain"
              aria-hidden="true"
            >
              <h1 className="text-center text-black text-6xl sm:text-7xl md:text-8xl pt-6 sm:pt-8 font-black">
                404
              </h1>
            </div>

            <div className="mt-[-50px]">
              <h3 className="text-2xl text-black sm:text-3xl font-black mb-4 uppercase tracking-tighter">
                Look like you're lost
              </h3>
              <p className="mb-6 text-gray-500 sm:mb-5 text-sm font-medium">
                The page you are looking for is not available!
              </p>

              <Button
                variant="default"
                onClick={() => router.push("/")}
                className="my-5 bg-black hover:bg-neutral-800 text-white rounded-xl px-8 py-6 text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
